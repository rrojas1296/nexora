import {
  Prisma,
  type PrismaClient,
  type WhatsappConnection as ConnectionRecord,
  type WhatsappSendAttempt as AttemptRecord,
} from "../../../database/generated/client.js";
import type { WhatsappRepository, WhatsappSendResult } from "../contracts/whatsapp.ports.js";
import {
  WhatsappError,
  type WhatsappActor,
  type WhatsappCredentials,
  type WhatsappConversationSend,
} from "../models/whatsapp.js";

function connection(record: ConnectionRecord) {
  return {
    id: record.id,
    phoneNumberId: record.phoneNumberId,
    displayPhoneNumber: record.displayPhoneNumber,
    verifiedName: record.verifiedName,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function attempt(record: AttemptRecord) {
  return {
    id: record.id,
    status: record.status,
    providerMessageId: record.providerMessageId,
    providerErrorCode: record.providerErrorCode,
    providerHttpStatus: record.providerHttpStatus,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export class PrismaWhatsappRepository implements WhatsappRepository {
  constructor(private readonly client: PrismaClient) {}

  private async authorizeInTransaction(tx: Prisma.TransactionClient, actor: WhatsappActor) {
    // Serializes configuration changes and send reservations within this business.
    const [membership] = await tx.$queryRaw<{ role: string }[]>`
      SELECT m."role"::text AS "role" FROM "Memberships" m
      JOIN "Businesses" b ON b."id" = m."businessId"
      JOIN "Users" u ON u."id" = m."userId"
      JOIN "AuthSessions" s ON s."businessId" = m."businessId" AND s."userId" = m."userId"
      WHERE m."businessId" = ${actor.businessId}::uuid AND m."userId" = ${actor.userId}::uuid
        AND m."active" AND NOT m."isDeleted" AND NOT b."isDeleted"
        AND u."active" AND NOT u."isDeleted"
        AND s."id" = ${actor.sessionId}::uuid AND NOT s."isDeleted" AND s."revokedAt" IS NULL
        AND s."expiresAt" > CURRENT_TIMESTAMP AND s."idleExpiresAt" > CURRENT_TIMESTAMP
      FOR NO KEY UPDATE OF b FOR SHARE OF m
    `;
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      throw new WhatsappError("WHATSAPP_FORBIDDEN");
    }
  }

  async authorize(actor: WhatsappActor) {
    await this.client.$transaction((tx) => this.authorizeInTransaction(tx, actor));
  }

  async assertSignupPhoneAvailable(actor: WhatsappActor, phoneNumberId: string) {
    await this.client.$transaction(async (tx) => {
      await this.authorizeInTransaction(tx, actor);
      const reserved = await tx.whatsappConnection.findUnique({ where: { phoneNumberId } });
      if (reserved && reserved.businessId !== actor.businessId) {
        throw new WhatsappError("WHATSAPP_CONNECTION_CONFLICT");
      }
      const current = await tx.whatsappConnection.findUnique({
        where: { businessId: actor.businessId },
      });
      if (current && !current.isDeleted) throw new WhatsappError("WHATSAPP_CONNECTION_CONFLICT");
    });
  }

  getConnection(actor: WhatsappActor) {
    return this.client.$transaction(async (tx) => {
      await this.authorizeInTransaction(tx, actor);
      const record = await tx.whatsappConnection.findFirst({
        where: { businessId: actor.businessId, isDeleted: false },
      });
      return record ? connection(record) : null;
    });
  }

  async saveConnection(
    actor: WhatsappActor,
    credentials: WhatsappCredentials,
    onlyDisconnected = false,
  ) {
    try {
      return await this.client.$transaction(async (tx) => {
        await this.authorizeInTransaction(tx, actor);
        if (onlyDisconnected) {
          const current = await tx.whatsappConnection.findUnique({
            where: { businessId: actor.businessId },
          });
          if (current && !current.isDeleted)
            throw new WhatsappError("WHATSAPP_CONNECTION_CONFLICT");
        }
        const record = await tx.whatsappConnection.upsert({
          where: { businessId: actor.businessId },
          create: { ...credentials, businessId: actor.businessId },
          update: { ...credentials, isDeleted: false },
        });
        return connection(record);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new WhatsappError("WHATSAPP_CONNECTION_CONFLICT");
      }
      throw error;
    }
  }

  async disconnect(actor: WhatsappActor) {
    await this.client.$transaction(async (tx) => {
      await this.authorizeInTransaction(tx, actor);
      await tx.whatsappConnection.updateMany({
        where: { businessId: actor.businessId, isDeleted: false },
        data: { isDeleted: true, encryptedAccessToken: null },
      });
    });
  }

  reserveSend(
    actor: WhatsappActor,
    key: string,
    hash: string,
    conversation?: WhatsappConversationSend,
  ) {
    return this.client.$transaction(async (tx) => {
      await this.authorizeInTransaction(tx, actor);
      const thread = conversation
        ? await tx.whatsappThread.findFirst({
            where: {
              id: conversation.threadId,
              businessId: actor.businessId,
              isDeleted: false,
              phoneNumberId: conversation.phoneNumberId,
              contactWaId: conversation.contactWaId,
            },
          })
        : null;
      if (conversation && !thread) throw new WhatsappError("WHATSAPP_CONVERSATION_NOT_FOUND");
      const existing = await tx.whatsappSendAttempt.findUnique({
        where: { businessId_idempotencyKey: { businessId: actor.businessId, idempotencyKey: key } },
      });
      if (existing) {
        if (existing.isDeleted || existing.requestHash !== hash)
          throw new WhatsappError("WHATSAPP_IDEMPOTENCY_CONFLICT");
        if (
          conversation &&
          !(await tx.whatsappInboundMessage.findFirst({
            where: {
              businessId: actor.businessId,
              threadId: conversation.threadId,
              sendAttemptId: existing.id,
              direction: "OUTBOUND",
              isDeleted: false,
            },
            select: { id: true },
          }))
        )
          throw new WhatsappError("WHATSAPP_IDEMPOTENCY_CONFLICT");
        return { attempt: attempt(existing), credentials: null };
      }
      if (thread && thread.controlMode !== "HUMAN") throw new WhatsappError("WHATSAPP_AI_ACTIVE");
      const credentials = await tx.whatsappConnection.findFirst({
        where: { businessId: actor.businessId, isDeleted: false },
      });
      if (!credentials?.encryptedAccessToken) throw new WhatsappError("WHATSAPP_NOT_CONNECTED");
      const now = new Date();
      if (thread) {
        if (thread.phoneNumberId !== credentials.phoneNumberId)
          throw new WhatsappError("WHATSAPP_NOT_CONNECTED");
        const incoming = await tx.whatsappInboundMessage.findFirst({
          where: {
            businessId: actor.businessId,
            threadId: thread.id,
            direction: "INBOUND",
            isDeleted: false,
            sentAt: { lte: now },
          },
          orderBy: { sentAt: "desc" },
          select: { sentAt: true },
        });
        if (!incoming || now.getTime() >= incoming.sentAt.getTime() + 24 * 60 * 60_000)
          throw new WhatsappError("WHATSAPP_REPLY_WINDOW_CLOSED");
      }
      const record = await tx.whatsappSendAttempt.create({
        data: { businessId: actor.businessId, idempotencyKey: key, requestHash: hash },
      });
      if (thread && conversation) {
        await tx.whatsappInboundMessage.create({
          data: {
            businessId: actor.businessId,
            threadId: thread.id,
            direction: "OUTBOUND",
            sendAttemptId: record.id,
            type: "text",
            body: conversation.body,
            sentAt: now,
          },
        });
        await tx.whatsappThread.updateMany({
          where: {
            id: thread.id,
            businessId: actor.businessId,
            isDeleted: false,
            lastMessageAt: { lte: now },
          },
          data: {
            lastMessageAt: now,
            lastMessageBody: conversation.body,
            lastMessageType: "text",
            controlVersion: { increment: 1 },
          },
        });
      }
      return {
        attempt: attempt(record),
        credentials: { ...credentials, encryptedAccessToken: credentials.encryptedAccessToken },
      };
    });
  }

  async finishSend(businessId: string, attemptId: string, result: WhatsappSendResult) {
    // Persist the outcome even if the originating session has since expired.
    return this.client.$transaction(async (tx) => {
      const [record] = await tx.whatsappSendAttempt.updateManyAndReturn({
        where: { id: attemptId, businessId, isDeleted: false, status: "PENDING" },
        data: result,
      });
      if (!record) throw new WhatsappError("WHATSAPP_ATTEMPT_NOT_FOUND");
      await tx.whatsappInboundMessage.updateMany({
        where: { businessId, sendAttemptId: attemptId, direction: "OUTBOUND", isDeleted: false },
        data: { providerMessageId: result.providerMessageId },
      });
      return attempt(record);
    });
  }

  getConversationAttempt(actor: WhatsappActor, threadId: string, key: string) {
    return this.client.$transaction(async (tx) => {
      await this.authorizeInTransaction(tx, actor);
      const record = await tx.whatsappSendAttempt.findFirst({
        where: {
          businessId: actor.businessId,
          idempotencyKey: key,
          isDeleted: false,
          inboxMessage: {
            is: {
              businessId: actor.businessId,
              threadId,
              direction: "OUTBOUND",
              isDeleted: false,
              thread: { isDeleted: false, businessId: actor.businessId },
            },
          },
        },
      });
      if (!record) throw new WhatsappError("WHATSAPP_ATTEMPT_NOT_FOUND");
      return attempt(record);
    });
  }

  getAttempt(actor: WhatsappActor, attemptId: string) {
    return this.client.$transaction(async (tx) => {
      await this.authorizeInTransaction(tx, actor);
      const record = await tx.whatsappSendAttempt.findFirst({
        where: { id: attemptId, businessId: actor.businessId, isDeleted: false },
      });
      if (!record) throw new WhatsappError("WHATSAPP_ATTEMPT_NOT_FOUND");
      return attempt(record);
    });
  }
}
