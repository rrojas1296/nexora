import type { Prisma, PrismaClient, WhatsappThread } from "../../../database/generated/client.js";
import type {
  IncomingWhatsappMessage,
  WhatsappReplyAvailability,
} from "../models/whatsapp-inbox.js";
import type { WhatsappInboxRepository } from "../repositories/whatsapp-inbox.repository.js";
import { WhatsappError, type WhatsappActor } from "../models/whatsapp.js";

function summary(thread: WhatsappThread) {
  return {
    id: thread.id,
    phoneNumberId: thread.phoneNumberId,
    contactWaId: thread.contactWaId,
    contactName: thread.contactName,
    lastMessageAt: thread.lastMessageAt.toISOString(),
    lastMessageBody: thread.lastMessageBody,
    lastMessageType: thread.lastMessageType,
  };
}

export class PrismaWhatsappInboxRepository implements WhatsappInboxRepository {
  constructor(private readonly client: PrismaClient) {}

  private async authorize(tx: Prisma.TransactionClient, actor: WhatsappActor) {
    const [membership] = await tx.$queryRaw<{ businessId: string; role: string }[]>`
      SELECT m."businessId", m."role" FROM "Memberships" m
      JOIN "Businesses" b ON b."id" = m."businessId"
      JOIN "Users" u ON u."id" = m."userId"
      JOIN "AuthSessions" s ON s."businessId" = m."businessId" AND s."userId" = m."userId"
      WHERE m."businessId" = ${actor.businessId}::uuid AND m."userId" = ${actor.userId}::uuid
        AND m."active" AND NOT m."isDeleted" AND NOT b."isDeleted" AND u."active" AND NOT u."isDeleted"
        AND s."id" = ${actor.sessionId}::uuid AND NOT s."isDeleted" AND s."revokedAt" IS NULL
        AND s."expiresAt" > CURRENT_TIMESTAMP AND s."idleExpiresAt" > CURRENT_TIMESTAMP
      FOR SHARE OF b, m
    `;
    if (!membership) throw new WhatsappError("WHATSAPP_FORBIDDEN");
    return membership;
  }

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
    await tx.whatsappInboundMessage.create({
      data: {
        businessId,
        threadId: thread.id,
        providerMessageId: message.providerMessageId,
        type: message.type,
        body: message.body,
        sentAt: message.sentAt,
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

  threads(actor: WhatsappActor, cursor?: string) {
    return this.client.$transaction(async (tx) => {
      await this.authorize(tx, actor);
      const where = { businessId: actor.businessId, isDeleted: false };
      if (
        cursor &&
        !(await tx.whatsappThread.findFirst({
          where: { ...where, id: cursor },
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
        select: { id: true, phoneNumberId: true },
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
        include: { sendAttempt: { select: { status: true, isDeleted: true } } },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      return {
        items: records.slice(0, 50).map((message) => ({
          id: message.id,
          direction: message.direction,
          sendStatus:
            message.sendAttempt && !message.sendAttempt.isDeleted
              ? message.sendAttempt.status
              : null,
          type: message.type,
          body: message.body,
          sentAt: message.sentAt.toISOString(),
          receivedAt: message.receivedAt.toISOString(),
        })),
        nextCursor: records.length > 50 ? records[49]!.id : null,
        reply: await this.replyAvailability(
          tx,
          actor,
          threadId,
          thread.phoneNumberId,
          membership.role,
        ),
      };
    });
  }
}
