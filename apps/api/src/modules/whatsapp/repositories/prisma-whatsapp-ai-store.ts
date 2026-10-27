import type { Prisma, PrismaClient } from "../../../database/generated/client.js";
import type {
  AiReplyFallbackReason,
  AiReplyWork,
  WhatsappAiStore,
} from "../contracts/whatsapp-ai-store.js";
import type { WhatsappMessageHasher } from "../contracts/whatsapp.ports.js";
import type { WhatsappMessage } from "../models/whatsapp.js";
import { findAutomationAgent } from "./prisma-whatsapp-ai-agent.js";

const leaseMilliseconds = 120_000;

export class PrismaWhatsappAiStore implements WhatsappAiStore {
  constructor(
    private readonly client: PrismaClient,
    private readonly hasher: WhatsappMessageHasher,
    private readonly dailyLimit: number,
  ) {}

  async recoverExpired() {
    const before = new Date(Date.now() - leaseMilliseconds);
    const stale = await this.client.whatsappAiReplyJob.findMany({
      where: {
        isDeleted: false,
        updatedAt: { lt: before },
        status: { in: ["GENERATING", "SENDING"] },
      },
      take: 50,
    });
    for (const job of stale) {
      const attempt =
        job.status === "SENDING"
          ? await this.client.whatsappSendAttempt.findUnique({
              where: {
                businessId_idempotencyKey: { businessId: job.businessId, idempotencyKey: job.id },
              },
            })
          : null;
      const status =
        job.status === "GENERATING" || attempt?.status === "REJECTED"
          ? "FAILED"
          : attempt?.status === "ACCEPTED"
            ? "ACCEPTED"
            : "UNKNOWN";
      await this.complete(
        job.id,
        status,
        status === "UNKNOWN"
          ? "SEND_UNCERTAIN"
          : status === "FAILED"
            ? "WORKER_INTERRUPTED"
            : undefined,
        before,
      );
    }
  }

  claim(provider: string, model: string): Promise<AiReplyWork | null> {
    return this.client.$transaction(async (tx) => {
      // All mutations lock Business first, then thread/job. Replicas never claim the same work.
      const [candidate] = await tx.$queryRaw<{ businessId: string; id: string }[]>`
        SELECT j."businessId", j."id" FROM "WhatsappAiReplyJobs" j
        JOIN "Businesses" b ON b."id" = j."businessId"
        WHERE j."status" = 'QUEUED' AND NOT j."isDeleted"
        AND NOT EXISTS (SELECT 1 FROM "WhatsappAiReplyJobs" running
          WHERE running."businessId" = j."businessId" AND running."threadId" = j."threadId"
          AND running."status" IN ('GENERATING', 'SENDING') AND NOT running."isDeleted")
        ORDER BY j."createdAt", j."id" LIMIT 1 FOR NO KEY UPDATE OF b SKIP LOCKED
      `;
      if (!candidate) return null;
      const job = await tx.whatsappAiReplyJob.findFirst({
        where: {
          id: candidate.id,
          businessId: candidate.businessId,
          status: "QUEUED",
          isDeleted: false,
        },
      });
      if (!job) return null;
      const snapshot = await this.snapshot(tx, job.businessId, job.threadId);
      const trigger = await tx.whatsappInboundMessage.findFirst({
        where: {
          id: job.triggerMessageId,
          businessId: job.businessId,
          threadId: job.threadId,
          direction: "INBOUND",
          type: { in: ["text", "image", "document", "location"] },
          isDeleted: false,
        },
        omit: { mediaData: true },
      });
      const now = new Date();
      if (
        !snapshot ||
        !trigger ||
        snapshot.thread.controlVersion !== job.threadVersion ||
        trigger.sentAt > now ||
        now.getTime() - trigger.sentAt.getTime() >= 86_400_000
      ) {
        await tx.whatsappAiReplyJob.update({
          where: { id: job.id },
          data: { status: "SKIPPED", reason: "NO_LONGER_ELIGIBLE" },
        });
        return null;
      }
      const [minuteCount, dayCount] = await Promise.all([
        tx.whatsappAiReplyJob.count({
          where: {
            businessId: job.businessId,
            startedAt: { gte: new Date(now.getTime() - 60_000) },
          },
        }),
        tx.whatsappAiReplyJob.count({
          where: {
            businessId: job.businessId,
            startedAt: { gte: new Date(now.getTime() - 86_400_000) },
          },
        }),
      ]);
      if (minuteCount >= 10 || dayCount >= this.dailyLimit) {
        await tx.whatsappAiReplyJob.update({
          where: { id: job.id },
          data: { status: "SKIPPED", reason: "RATE_LIMIT" },
        });
        return null;
      }
      const recent = await tx.whatsappInboundMessage.findMany({
        where: {
          businessId: job.businessId,
          threadId: job.threadId,
          isDeleted: false,
          type: { in: ["text", "image", "document", "location"] },
          OR: [
            { direction: "INBOUND" },
            {
              direction: "OUTBOUND",
              sendAttempt: { is: { isDeleted: false, status: "ACCEPTED" } },
            },
          ],
        },
        orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
        take: 20,
        omit: { mediaData: true },
      });
      let remaining = 16_000;
      const history = recent
        .flatMap((entry) => {
          const content =
            entry.direction === "INBOUND" && entry.type !== "text"
              ? JSON.stringify({
                  messageId: entry.id,
                  type: entry.type,
                  caption: entry.body.slice(0, 1500),
                  mediaStatus: entry.mediaStatus,
                  location:
                    entry.locationLatitude !== null
                      ? {
                          latitude: entry.locationLatitude,
                          longitude: entry.locationLongitude,
                          address: entry.locationAddress,
                          name: entry.locationName,
                        }
                      : null,
                  note: "Metadata only, file contents not available",
                })
              : entry.body;
          const text = content.slice(0, Math.min(4096, remaining));
          remaining -= text.length;
          return text
            ? [
                {
                  role: entry.direction === "INBOUND" ? ("user" as const) : ("assistant" as const),
                  text,
                },
              ]
            : [];
        })
        .reverse();
      const previousReply = await tx.whatsappInboundMessage.findFirst({
        where: {
          businessId: job.businessId,
          threadId: job.threadId,
          direction: "OUTBOUND",
          isDeleted: false,
          sendAttempt: { is: { isDeleted: false, status: "ACCEPTED" } },
        },
        select: { id: true },
      });
      await tx.whatsappAiReplyJob.update({
        where: { id: job.id },
        data: {
          status: "GENERATING",
          startedAt: now,
          provider,
          model,
          contextVersion: snapshot.business.contextVersion,
        },
      });
      return {
        id: job.id,
        businessId: job.businessId,
        threadId: job.threadId,
        threadVersion: job.threadVersion,
        contextVersion: snapshot.business.contextVersion,
        agentUpdatedAt: snapshot.agent.updatedAt,
        connectionUpdatedAt: snapshot.connection.updatedAt,
        input: {
          businessName: snapshot.business.name,
          context: snapshot.business.contextPublished,
          agentName: snapshot.agent.name,
          tone: snapshot.agent.tone,
          instructions: snapshot.agent.instructions,
          greeting: snapshot.agent.greeting,
          firstReply: !previousReply,
          history,
        },
      };
    });
  }

  private async snapshot(tx: Prisma.TransactionClient, businessId: string, threadId: string) {
    const business = await tx.business.findFirst({
      where: {
        id: businessId,
        isDeleted: false,
        contextVersion: { gt: 0 },
        contextPublished: { not: "" },
      },
    });
    const thread = await tx.whatsappThread.findFirst({
      where: { businessId, id: threadId, isDeleted: false, controlMode: "AI" },
    });
    const agent = await findAutomationAgent(tx, businessId);
    const connection = await tx.whatsappConnection.findFirst({
      where: { businessId, isDeleted: false, encryptedAccessToken: { not: null } },
    });
    if (
      !business ||
      !thread ||
      !agent ||
      !connection ||
      thread.phoneNumberId !== connection.phoneNumberId
    )
      return null;
    return { business, thread, agent, connection };
  }

  reserve(work: AiReplyWork, text: string, options?: { fallbackReason?: AiReplyFallbackReason }) {
    return this.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Businesses" WHERE "id" = ${work.businessId}::uuid FOR NO KEY UPDATE`;
      const job = await tx.whatsappAiReplyJob.findFirst({
        where: {
          id: work.id,
          businessId: work.businessId,
          status: "GENERATING",
          isDeleted: false,
          updatedAt: { gte: new Date(Date.now() - leaseMilliseconds) },
        },
      });
      if (!job) return null;
      const current = await this.snapshot(tx, work.businessId, work.threadId);
      const trigger = await tx.whatsappInboundMessage.findFirst({
        where: {
          id: job.triggerMessageId,
          businessId: work.businessId,
          threadId: work.threadId,
          isDeleted: false,
          direction: "INBOUND",
          sentAt: { lte: new Date(), gt: new Date(Date.now() - 86_400_000) },
        },
      });
      if (
        !current ||
        !trigger ||
        current.thread.controlVersion !== work.threadVersion ||
        current.business.contextVersion !== work.contextVersion ||
        current.agent.updatedAt.getTime() !== work.agentUpdatedAt.getTime() ||
        current.connection.updatedAt.getTime() !== work.connectionUpdatedAt.getTime() ||
        !text.trim() ||
        text.length > 4096
      ) {
        await tx.whatsappAiReplyJob.update({
          where: { id: job.id },
          data: { status: "CANCELLED", reason: "CONFIG_OR_THREAD_CHANGED" },
        });
        return null;
      }
      if (options?.fallbackReason) {
        // An accepted fallback is not an accepted order summary from this job.
        await tx.order.updateMany({
          where: {
            businessId: work.businessId,
            threadId: work.threadId,
            isDeleted: false,
            confirmationJobId: work.id,
          },
          data: { confirmationToken: null, confirmationJobId: null },
        });
      }
      const message: WhatsappMessage = {
        type: "text",
        to: current.thread.contactWaId,
        text: { body: text, previewUrl: false },
      };
      const attempt = await tx.whatsappSendAttempt.create({
        data: {
          businessId: work.businessId,
          idempotencyKey: work.id,
          requestHash: this.hasher.hash(message),
        },
      });
      const now = new Date();
      await tx.whatsappInboundMessage.create({
        data: {
          businessId: work.businessId,
          threadId: work.threadId,
          direction: "OUTBOUND",
          source: "AI",
          sendAttemptId: attempt.id,
          type: "text",
          body: text,
          sentAt: now,
        },
      });
      await tx.whatsappThread.update({
        where: { businessId_id: { businessId: work.businessId, id: work.threadId } },
        data: { lastMessageAt: now, lastMessageBody: text, lastMessageType: "text" },
      });
      await tx.whatsappAiReplyJob.update({
        where: { id: job.id },
        data: {
          status: "SENDING",
          reason: options?.fallbackReason ? `GENERATION_FALLBACK_${options.fallbackReason}` : null,
        },
      });
      return {
        message,
        attempt: {
          ...attempt,
          createdAt: attempt.createdAt.toISOString(),
          updatedAt: attempt.updatedAt.toISOString(),
        },
        credentials: {
          ...current.connection,
          encryptedAccessToken: current.connection.encryptedAccessToken!,
        },
      };
    });
  }

  finish(id: string, status: "ACCEPTED" | "FAILED" | "UNKNOWN", reason?: string) {
    return this.complete(id, status, reason);
  }

  private async complete(
    id: string,
    status: "ACCEPTED" | "FAILED" | "UNKNOWN",
    reason?: string,
    staleBefore?: Date,
  ) {
    await this.client.$transaction(async (tx) => {
      const job = await tx.whatsappAiReplyJob.findFirst({ where: { id, isDeleted: false } });
      if (!job) return;
      await tx.$queryRaw`SELECT "id" FROM "Businesses" WHERE "id" = ${job.businessId}::uuid FOR NO KEY UPDATE`;
      const changed = await tx.whatsappAiReplyJob.updateMany({
        where: {
          id,
          businessId: job.businessId,
          isDeleted: false,
          status: { in: ["GENERATING", "SENDING"] },
          ...(staleBefore ? { updatedAt: { lt: staleBefore } } : {}),
        },
        data: { status, ...(reason !== undefined ? { reason } : {}) },
      });
      if (changed.count && status === "UNKNOWN") {
        await tx.whatsappThread.updateMany({
          where: { id: job.threadId, businessId: job.businessId, isDeleted: false },
          data: { controlMode: "HUMAN", controlVersion: { increment: 1 } },
        });
        await tx.whatsappAiReplyJob.updateMany({
          where: {
            businessId: job.businessId,
            threadId: job.threadId,
            status: { in: ["QUEUED", "GENERATING"] },
            isDeleted: false,
          },
          data: { status: "CANCELLED", reason: "SEND_UNCERTAIN" },
        });
      }
    });
  }
}
