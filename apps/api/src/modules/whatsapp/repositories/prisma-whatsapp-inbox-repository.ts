import type { Prisma, PrismaClient, WhatsappThread } from "../../../database/generated/client.js";
import type {
  IncomingWhatsappMessage,
  WhatsappReplyAvailability,
} from "../models/whatsapp-inbox.js";
import type { WhatsappInboxRepository } from "../repositories/whatsapp-inbox.repository.js";
import { WhatsappError, type WhatsappActor } from "../models/whatsapp.js";
import { findAutomationAgent } from "./prisma-whatsapp-ai-agent.js";
import { authorizeWhatsappActor } from "./authorize-whatsapp-actor.js";

function summary(thread: WhatsappThread) {
  return {
    id: thread.id,
    phoneNumberId: thread.phoneNumberId,
    contactWaId: thread.contactWaId,
    contactName: thread.contactName,
    lastMessageAt: thread.lastMessageAt.toISOString(),
    lastMessageBody: thread.lastMessageBody,
    lastMessageType: thread.lastMessageType,
    controlMode: thread.controlMode,
  };
}

export class PrismaWhatsappInboxRepository implements WhatsappInboxRepository {
  constructor(
    private readonly client: PrismaClient,
    private readonly automationEnabled = false,
  ) {}

  private readonly authorize = authorizeWhatsappActor;

  async receive(messages: IncomingWhatsappMessage[]) {
    const groups = new Map<string, IncomingWhatsappMessage[]>();
    for (const message of messages) {
      const group = groups.get(message.phoneNumberId) ?? [];
      group.push(message);
      groups.set(message.phoneNumberId, group);
    }
    for (const [phoneNumberId, group] of groups) {
      const connection = await this.client.whatsappConnection.findFirst({
        where: {
          phoneNumberId,
          isDeleted: false,
          encryptedAccessToken: { not: null },
          business: { isDeleted: false },
        },
        select: { businessId: true },
      });
      if (!connection) continue;
      await this.client.$transaction(
        async (tx) => {
          // Same lock as connect/disconnect: events cannot race a connection change.
          await tx.$queryRaw`SELECT "id" FROM "Businesses" WHERE "id" = ${connection.businessId}::uuid AND NOT "isDeleted" FOR NO KEY UPDATE`;
          const active = await tx.whatsappConnection.findFirst({
            where: {
              businessId: connection.businessId,
              phoneNumberId,
              isDeleted: false,
              encryptedAccessToken: { not: null },
              business: { isDeleted: false },
            },
          });
          if (!active) return;
          for (const message of group) await this.insert(tx, connection.businessId, message);
        },
        { timeout: 20_000 },
      );
    }
  }

  private async insert(
    tx: Prisma.TransactionClient,
    businessId: string,
    message: IncomingWhatsappMessage,
  ) {
    const existing = await tx.whatsappInboundMessage.findUnique({
      where: {
        businessId_providerMessageId: { businessId, providerMessageId: message.providerMessageId },
      },
      select: { id: true },
    });
    if (existing) return; // Includes deleted records: never resurrect on provider replay.
    const thread = await tx.whatsappThread.upsert({
      where: {
        businessId_phoneNumberId_contactWaId: {
          businessId,
          phoneNumberId: message.phoneNumberId,
          contactWaId: message.contactWaId,
        },
      },
      create: {
        businessId,
        phoneNumberId: message.phoneNumberId,
        contactWaId: message.contactWaId,
        contactName: message.contactName,
        lastMessageAt: message.sentAt,
        lastMessageBody: message.body,
        lastMessageType: message.type,
      },
      update: {},
    });
    if (thread.isDeleted) return;
    const inbound = await tx.whatsappInboundMessage.create({
      data: {
        source: "CUSTOMER",
        businessId,
        threadId: thread.id,
        providerMessageId: message.providerMessageId,
        type: message.type,
        body: message.body,
        mediaId: message.mediaId,
        mediaMimeType: message.mediaMimeType,
        mediaStatus: message.mediaId ? "PENDING" : "NONE",
        locationLatitude: message.location?.latitude,
        locationLongitude: message.location?.longitude,
        locationName: message.location?.name,
        locationAddress: message.location?.address,
        sentAt: message.sentAt,
      },
    });
    const updated = await tx.whatsappThread.update({
      where: { businessId_id: { businessId, id: thread.id } },
      data: { controlVersion: { increment: 1 } },
    });
    const agent =
      this.automationEnabled &&
      updated.controlMode === "AI" &&
      ((message.type === "text" && message.body.trim()) || message.mediaId || message.location)
        ? await findAutomationAgent(tx, businessId)
        : null;
    if (agent)
      await tx.whatsappAiReplyJob.create({
        data: {
          businessId,
          threadId: thread.id,
          triggerMessageId: inbound.id,
          threadVersion: updated.controlVersion,
        },
      });
    if (message.sentAt >= thread.lastMessageAt) {
      await tx.whatsappThread.update({
        where: { businessId_id: { businessId, id: thread.id } },
        data: {
          lastMessageAt: message.sentAt,
          lastMessageBody: message.body,
          lastMessageType: message.type,
          ...(message.contactName !== message.contactWaId
            ? { contactName: message.contactName }
            : {}),
        },
      });
    }
  }

  setControl(actor: WhatsappActor, threadId: string, mode: "AI" | "HUMAN", version: number) {
    return this.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Businesses" WHERE "id" = ${actor.businessId}::uuid FOR NO KEY UPDATE`;
      const membership = await this.authorize(tx, actor);
      if (!["OWNER", "ADMIN"].includes(membership.role))
        throw new WhatsappError("WHATSAPP_FORBIDDEN");
      const thread = await tx.whatsappThread.findFirst({
        where: { businessId: actor.businessId, id: threadId, isDeleted: false },
      });
      if (!thread) throw new WhatsappError("WHATSAPP_CONVERSATION_NOT_FOUND");
      if (thread.controlVersion !== version) throw new WhatsappError("WHATSAPP_CONTROL_CONFLICT");
      if (
        mode === "AI" &&
        (!this.automationEnabled || !(await findAutomationAgent(tx, actor.businessId)))
      )
        throw new WhatsappError("WHATSAPP_NOT_CONFIGURED");
      await tx.whatsappThread.update({
        where: { businessId_id: { businessId: actor.businessId, id: threadId } },
        data: { controlMode: mode, controlVersion: { increment: 1 } },
      });
      await tx.whatsappAiReplyJob.updateMany({
        where: {
          businessId: actor.businessId,
          threadId,
          isDeleted: false,
          status: { in: ["QUEUED", "GENERATING"] },
        },
        data: { status: "CANCELLED", reason: "CONTROL_CHANGED" },
      });
      return { mode, version: version + 1 };
    });
  }

  threads(actor: WhatsappActor, cursor?: string, search?: string) {
    return this.client.$transaction(async (tx) => {
      await this.authorize(tx, actor);
      const term = search?.trim();
      const phone = term && /^[+\d\s().-]+$/.test(term) ? term.replace(/\D/g, "") : "";
      const escapedTerm = term?.replace(/[\\%_]/g, "\\$&");
      const where: Prisma.WhatsappThreadWhereInput = {
        businessId: actor.businessId,
        isDeleted: false,
        ...(term
          ? {
              OR: [
                { contactName: { contains: escapedTerm, mode: "insensitive" } },
                { contactWaId: { contains: phone || escapedTerm } },
              ],
            }
          : {}),
      };
      if (
        cursor &&
        !(await tx.whatsappThread.findFirst({
          where: { businessId: actor.businessId, isDeleted: false, id: cursor },
          select: { id: true },
        }))
      )
        throw new WhatsappError("WHATSAPP_CONVERSATION_NOT_FOUND");
      const records = await tx.whatsappThread.findMany({
        where,
        orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
        take: 21,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      return {
        items: records.slice(0, 20).map(summary),
        nextCursor: records.length > 20 ? records[19]!.id : null,
      };
    });
  }

  recipient(actor: WhatsappActor, threadId: string) {
    return this.client.$transaction(async (tx) => {
      const membership = await this.authorize(tx, actor);
      if (membership.role !== "OWNER" && membership.role !== "ADMIN")
        throw new WhatsappError("WHATSAPP_FORBIDDEN");
      const thread = await tx.whatsappThread.findFirst({
        where: { id: threadId, businessId: actor.businessId, isDeleted: false },
        select: { phoneNumberId: true, contactWaId: true },
      });
      if (!thread) throw new WhatsappError("WHATSAPP_CONVERSATION_NOT_FOUND");
      return thread;
    });
  }

  private async replyAvailability(
    tx: Prisma.TransactionClient,
    actor: WhatsappActor,
    threadId: string,
    phoneNumberId: string,
    role: string,
    mode: "AI" | "HUMAN",
  ): Promise<WhatsappReplyAvailability> {
    const now = new Date();
    const [incoming, connection] = await Promise.all([
      tx.whatsappInboundMessage.findFirst({
        where: {
          businessId: actor.businessId,
          threadId,
          direction: "INBOUND",
          isDeleted: false,
          sentAt: { lte: now },
        },
        orderBy: { sentAt: "desc" },
        select: { sentAt: true },
      }),
      tx.whatsappConnection.findFirst({
        where: {
          businessId: actor.businessId,
          phoneNumberId,
          isDeleted: false,
          encryptedAccessToken: { not: null },
        },
        select: { id: true },
      }),
    ]);
    const expires = incoming ? new Date(incoming.sentAt.getTime() + 24 * 60 * 60_000) : null;
    const reason =
      role !== "OWNER" && role !== "ADMIN"
        ? "forbidden"
        : !connection
          ? "notConnected"
          : !expires || expires <= now
            ? "windowClosed"
            : mode === "AI"
              ? "aiActive"
              : "allowed";
    return {
      allowed: reason === "allowed",
      reason,
      windowExpiresAt: expires?.toISOString() ?? null,
    };
  }

  messages(actor: WhatsappActor, threadId: string, cursor?: string) {
    return this.client.$transaction(async (tx) => {
      const membership = await this.authorize(tx, actor);
      const thread = await tx.whatsappThread.findFirst({
        where: { id: threadId, businessId: actor.businessId, isDeleted: false },
        select: { id: true, phoneNumberId: true, controlMode: true, controlVersion: true },
      });
      if (!thread) throw new WhatsappError("WHATSAPP_CONVERSATION_NOT_FOUND");
      const where = { businessId: actor.businessId, threadId, isDeleted: false };
      if (
        cursor &&
        !(await tx.whatsappInboundMessage.findFirst({
          where: { ...where, id: cursor },
          select: { id: true },
        }))
      )
        throw new WhatsappError("WHATSAPP_CONVERSATION_NOT_FOUND");
      const records = await tx.whatsappInboundMessage.findMany({
        where,
        orderBy: [{ sentAt: "desc" }, { id: "desc" }],
        take: 51,
        omit: { mediaData: true },
        include: { sendAttempt: { select: { status: true, isDeleted: true } } },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      return {
        items: records.slice(0, 50).map((message) => ({
          id: message.id,
          direction: message.direction,
          source: message.source,
          sendStatus:
            message.sendAttempt && !message.sendAttempt.isDeleted
              ? message.sendAttempt.status
              : null,
          type: message.type,
          body: message.body,
          sentAt: message.sentAt.toISOString(),
          receivedAt: message.receivedAt.toISOString(),
          mediaStatus: message.mediaStatus,
          location:
            message.locationLatitude !== null && message.locationLongitude !== null
              ? {
                  latitude: message.locationLatitude,
                  longitude: message.locationLongitude,
                  name: message.locationName,
                  address: message.locationAddress,
                }
              : null,
        })),
        nextCursor: records.length > 50 ? records[49]!.id : null,
        automation: {
          mode: thread.controlMode,
          version: thread.controlVersion,
          configured: this.automationEnabled,
          canManage: membership.role === "OWNER" || membership.role === "ADMIN",
          ready: this.automationEnabled && !!(await findAutomationAgent(tx, actor.businessId)),
          lastJob: await tx.whatsappAiReplyJob.findFirst({
            where: { businessId: actor.businessId, threadId, isDeleted: false },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: { status: true, reason: true },
          }),
          inFlight: !!(await tx.whatsappAiReplyJob.findFirst({
            where: { businessId: actor.businessId, threadId, status: "SENDING", isDeleted: false },
            select: { id: true },
          })),
        },
        reply: await this.replyAvailability(
          tx,
          actor,
          threadId,
          thread.phoneNumberId,
          membership.role,
          thread.controlMode,
        ),
      };
    });
  }
}
