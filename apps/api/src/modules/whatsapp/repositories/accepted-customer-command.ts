import type { Prisma } from "../../../database/generated/client.js";
import type { AiReplyWork } from "../contracts/whatsapp-ai-store.js";

export async function acceptedCustomerCommand(
  tx: Prisma.TransactionClient,
  work: AiReplyWork,
  jobId: string,
  commands: string[],
) {
  const [summary, job] = await Promise.all([
    tx.whatsappSendAttempt.findUnique({
      where: { businessId_idempotencyKey: { businessId: work.businessId, idempotencyKey: jobId } },
      include: { inboxMessage: true },
    }),
    tx.whatsappAiReplyJob.findUniqueOrThrow({
      where: { id: work.id },
      include: { triggerMessage: { select: { body: true, type: true, receivedAt: true } } },
    }),
  ]);
  const command = summary?.inboxMessage?.body.split("\n").at(-1);
  return !!(
    command &&
    commands.includes(command) &&
    summary?.status === "ACCEPTED" &&
    !summary.isDeleted &&
    summary.inboxMessage &&
    !summary.inboxMessage.isDeleted &&
    summary.inboxMessage.threadId === work.threadId &&
    summary.inboxMessage.direction === "OUTBOUND" &&
    job.triggerMessage.type === "text" &&
    job.triggerMessage.receivedAt > summary.updatedAt &&
    job.triggerMessage.body.trim() === command
  );
}
