import { z } from "zod";
import type {
  PrismaClient,
  WhatsappAuthorizationAttempt,
} from "../../../infrastructure/database/generated/client.js";
import type {
  WhatsappAuthorizationStore,
  WhatsappAuthorizationAttempt as AuthorizationAttempt,
} from "../domain/whatsapp-authorization.js";
import { WhatsappError, type WhatsappActor } from "../domain/whatsapp.js";

const assetsSchema = z.array(
  z.object({
    wabaId: z.string(),
    phoneNumberId: z.string(),
    displayPhoneNumber: z.string(),
    verifiedName: z.string(),
  }),
);

function attempt(record: WhatsappAuthorizationAttempt): AuthorizationAttempt {
  return {
    ...record,
    locale: record.locale === "en" ? "en" : "es",
    assets: assetsSchema.parse(record.assets),
  };
}

export class PrismaWhatsappAuthorizationStore implements WhatsappAuthorizationStore {
  constructor(private readonly client: PrismaClient) {}

  private scope(actor: WhatsappActor) {
    return { ...actor, isDeleted: false };
  }

  private async expire(actor: WhatsappActor) {
    // Lazy cleanup across instances; no expired encrypted credential is usable.
    await this.client.whatsappAuthorizationAttempt.updateMany({
      where: {
        ...this.scope(actor),
        OR: [
          { expiresAt: { lte: new Date() }, status: { in: ["PENDING", "PROCESSING", "READY"] } },
          // A completion already claimed may finish its bounded provider calls after expiry.
          { expiresAt: { lte: new Date(Date.now() - 5 * 60_000) }, status: "COMPLETING" },
        ],
      },
      data: { status: "EXPIRED", encryptedAccessToken: null, assets: [] },
    });
  }

  async create(actor: WhatsappActor, stateHash: string, locale: "es" | "en") {
    await this.expire(actor);
    return attempt(
      await this.client.whatsappAuthorizationAttempt.create({
        data: { ...actor, stateHash, locale, expiresAt: new Date(Date.now() + 15 * 60_000) },
      }),
    );
  }

  private async claim(
    actor: WhatsappActor,
    where: { id?: string; stateHash?: string },
    from: string,
    to: string,
  ) {
    await this.expire(actor);
    const [record] = await this.client.whatsappAuthorizationAttempt.updateManyAndReturn({
      where: { ...this.scope(actor), ...where, status: from, expiresAt: { gt: new Date() } },
      data: { status: to },
    });
    if (!record) throw new WhatsappError("WHATSAPP_SIGNUP_EXPIRED");
    return attempt(record);
  }

  claimCallback(actor: WhatsappActor, stateHash: string) {
    return this.claim(actor, { stateHash }, "PENDING", "PROCESSING");
  }

  claimCompletion(actor: WhatsappActor, id: string) {
    return this.claim(actor, { id }, "READY", "COMPLETING");
  }

  async get(actor: WhatsappActor, id: string) {
    await this.expire(actor);
    const record = await this.client.whatsappAuthorizationAttempt.findFirst({
      where: { ...this.scope(actor), id },
    });
    if (!record) throw new WhatsappError("WHATSAPP_ATTEMPT_NOT_FOUND");
    return attempt(record);
  }

  async ready(
    actor: WhatsappActor,
    id: string,
    encryptedAccessToken: string,
    assets: AuthorizationAttempt["assets"],
  ) {
    const result = await this.client.whatsappAuthorizationAttempt.updateMany({
      where: { ...this.scope(actor), id, status: "PROCESSING", expiresAt: { gt: new Date() } },
      data: {
        status: "READY",
        encryptedAccessToken,
        assets: assets.map((asset) => ({ ...asset })),
      },
    });
    if (result.count !== 1) throw new WhatsappError("WHATSAPP_SIGNUP_EXPIRED");
  }

  async finish(actor: WhatsappActor, id: string, status: "CONNECTED" | "FAILED" | "CANCELLED") {
    await this.client.whatsappAuthorizationAttempt.updateMany({
      where: { ...this.scope(actor), id, status: { in: ["PROCESSING", "READY", "COMPLETING"] } },
      data: { status, encryptedAccessToken: null, assets: [] },
    });
  }
}
