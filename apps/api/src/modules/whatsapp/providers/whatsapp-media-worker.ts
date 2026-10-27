import { Logger, type OnModuleInit, type OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { z } from "zod";
import sharp from "sharp";
import type { Environment } from "../../../config/environment.js";
import type { PrismaClient } from "../../../database/generated/client.js";
import type { WhatsappTokenVault } from "../contracts/whatsapp.ports.js";

const maxBytes = 5 * 1024 * 1024;
const metadataSchema = z.object({
  url: z.url(),
  mime_type: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  file_size: z.number().int().positive().max(maxBytes),
});

export class WhatsappMediaWorker implements OnModuleInit, OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | undefined;
  private running: Promise<void> | undefined;
  private readonly logger = new Logger(WhatsappMediaWorker.name);

  constructor(
    private readonly client: PrismaClient,
    private readonly vault: WhatsappTokenVault,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  onModuleInit() {
    if (
      !this.config.get("WHATSAPP_GRAPH_API_VERSION", { infer: true }) ||
      !this.config.get("WHATSAPP_CREDENTIALS_KEY", { infer: true })
    )
      return;
    this.timer = setInterval(() => {
      if (this.running) return;
      this.running = this.processOne()
        .catch(() => {
          this.logger.error(
            "Media processing failed; inspect database/configuration. No automatic download retry.",
          );
        })
        .finally(() => {
          this.running = undefined;
        });
    }, 2000);
    this.timer.unref();
  }

  async onModuleDestroy() {
    clearInterval(this.timer);
    await this.running;
  }

  private async processOne() {
    await this.client.whatsappInboundMessage.updateMany({
      where: { mediaStatus: "DOWNLOADING", mediaStartedAt: { lt: new Date(Date.now() - 120_000) } },
      data: { mediaStatus: "FAILED" },
    });
    const message = await this.client.whatsappInboundMessage.findFirst({
      where: {
        isDeleted: false,
        mediaStatus: "PENDING",
        thread: { isDeleted: false },
        business: { isDeleted: false },
      },
      orderBy: { receivedAt: "asc" },
      omit: { mediaData: true },
      include: { thread: { select: { phoneNumberId: true } } },
    });
    if (!message) return;
    const claimed = await this.client.whatsappInboundMessage.updateMany({
      where: { id: message.id, mediaStatus: "PENDING", isDeleted: false },
      data: { mediaStatus: "DOWNLOADING", mediaStartedAt: new Date() },
    });
    if (!claimed.count) return;
    try {
      if (
        (await this.client.whatsappInboundMessage.count({
          where: { businessId: message.businessId, mediaStatus: "READY" },
        })) >= 1000
      )
        throw new Error("MEDIA_QUOTA_REACHED");
      const connection = await this.client.whatsappConnection.findFirst({
        where: {
          businessId: message.businessId,
          phoneNumberId: message.thread.phoneNumberId,
          isDeleted: false,
          encryptedAccessToken: { not: null },
        },
      });
      if (!connection?.encryptedAccessToken || !message.mediaId)
        throw new Error("MEDIA_UNAVAILABLE");
      const token = this.vault.decrypt(
        connection.encryptedAccessToken,
        message.businessId,
        connection.phoneNumberId,
      );
      const version = this.config.get("WHATSAPP_GRAPH_API_VERSION", { infer: true });
      const signal = AbortSignal.timeout(25_000);
      const headers = { Authorization: `Bearer ${token}` };
      const metadataResponse = await fetch(
        `https://graph.facebook.com/${version}/${message.mediaId}?phone_number_id=${connection.phoneNumberId}`,
        { headers, redirect: "error", signal },
      );
      if (!metadataResponse.ok) {
        await metadataResponse.body?.cancel();
        throw new Error("MEDIA_UNAVAILABLE");
      }
      const metadata = metadataSchema.parse(
        JSON.parse((await this.readBounded(metadataResponse, 16_384)).toString("utf8")),
      );
      const url = new URL(metadata.url);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "lookaside.fbsbx.com" ||
        url.port ||
        url.username ||
        url.password
      )
        throw new Error("MEDIA_URL_REJECTED");
      const response = await fetch(url, { headers, redirect: "error", signal });
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error("MEDIA_UNAVAILABLE");
      }
      let bytes = await this.readBounded(response, maxBytes);
      let mime = metadata.mime_type;
      if (mime === "application/pdf") {
        if (message.type !== "document" || !bytes.subarray(0, 5).equals(Buffer.from("%PDF-")))
          throw new Error("INVALID_PDF");
      } else {
        const image = sharp(bytes, { limitInputPixels: 20_000_000, animated: false });
        const info = await image.metadata();
        if (!["jpeg", "png", "webp"].includes(info.format ?? "")) throw new Error("INVALID_IMAGE");
        bytes = await image
          .rotate()
          .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();
        mime = "image/webp";
      }
      if (bytes.length > maxBytes) throw new Error("MEDIA_TOO_LARGE");
      await this.client.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "Businesses" WHERE "id" = ${message.businessId}::uuid FOR NO KEY UPDATE`;
        const active = await tx.whatsappConnection.findFirst({
          where: {
            id: connection.id,
            businessId: message.businessId,
            phoneNumberId: connection.phoneNumberId,
            updatedAt: connection.updatedAt,
            isDeleted: false,
            encryptedAccessToken: { not: null },
            business: { isDeleted: false },
          },
        });
        if (!active) throw new Error("CONNECTION_CHANGED");
        if (
          (await tx.whatsappInboundMessage.count({
            where: { businessId: message.businessId, mediaStatus: "READY" },
          })) >= 1000
        )
          throw new Error("MEDIA_QUOTA_REACHED");
        await tx.whatsappInboundMessage.updateMany({
          where: {
            id: message.id,
            businessId: message.businessId,
            isDeleted: false,
            mediaStatus: "DOWNLOADING",
            thread: { isDeleted: false },
          },
          data: { mediaStatus: "READY", mediaData: Uint8Array.from(bytes), mediaMimeType: mime },
        });
      });
    } catch {
      await this.client.whatsappInboundMessage.updateMany({
        where: { id: message.id, mediaStatus: "DOWNLOADING" },
        data: { mediaStatus: "FAILED" },
      });
    }
  }

  private async readBounded(response: Response, limit: number): Promise<Buffer> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error("EMPTY_MEDIA");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error("MEDIA_TOO_LARGE");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  }
}
