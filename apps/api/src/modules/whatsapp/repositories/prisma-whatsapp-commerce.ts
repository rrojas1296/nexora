import type { Prisma, PrismaClient } from "../../../database/generated/client.js";
import type { ProofReview, WhatsappCommerceRepository } from "../contracts/whatsapp-commerce.js";
import { WhatsappError, type WhatsappActor } from "../models/whatsapp.js";
import { authorizeWhatsappActor } from "./authorize-whatsapp-actor.js";
import { orderInclude, orderView } from "./whatsapp-order-view.js";

export class PrismaWhatsappCommerce implements WhatsappCommerceRepository {
  constructor(private readonly client: PrismaClient) {}

  private async thread(tx: Prisma.TransactionClient, actor: WhatsappActor, id: string) {
    const membership = await authorizeWhatsappActor(tx, actor);
    const thread = await tx.whatsappThread.findFirst({
      where: { businessId: actor.businessId, id, isDeleted: false },
      select: { id: true },
    });
    if (!thread) throw new WhatsappError("WHATSAPP_CONVERSATION_NOT_FOUND");
    return membership;
  }

  orders(actor: WhatsappActor, threadId: string, cursor?: string) {
    return this.client.$transaction(async (tx) => {
      await this.thread(tx, actor, threadId);
      const where = { businessId: actor.businessId, threadId, isDeleted: false };
      if (
        cursor &&
        !(await tx.order.findFirst({ where: { ...where, id: cursor }, select: { id: true } }))
      )
        throw new WhatsappError("WHATSAPP_RESOURCE_NOT_FOUND");
      const rows = await tx.order.findMany({
        where,
        include: orderInclude,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 21,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      const items = rows.slice(0, 20);
      return {
        items: items.map(orderView),
        nextCursor: rows.length > 20 ? items.at(-1)!.id : null,
      };
    });
  }

  media(actor: WhatsappActor, threadId: string, messageId: string) {
    return this.client.$transaction(async (tx) => {
      await this.thread(tx, actor, threadId);
      const message = await tx.whatsappInboundMessage.findFirst({
        where: {
          businessId: actor.businessId,
          threadId,
          id: messageId,
          isDeleted: false,
          direction: "INBOUND",
          mediaStatus: "READY",
        },
        select: { mediaData: true, mediaMimeType: true },
      });
      if (!message?.mediaData || !message.mediaMimeType)
        throw new WhatsappError("WHATSAPP_RESOURCE_NOT_FOUND");
      return { bytes: message.mediaData, mime: message.mediaMimeType };
    });
  }

  review(
    actor: WhatsappActor,
    threadId: string,
    orderId: string,
    proofId: string,
    input: ProofReview,
  ) {
    return this.client.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Businesses" WHERE "id" = ${actor.businessId}::uuid FOR NO KEY UPDATE`;
      const membership = await this.thread(tx, actor, threadId);
      if (!["OWNER", "ADMIN"].includes(membership.role))
        throw new WhatsappError("WHATSAPP_FORBIDDEN");
      const proof = await tx.paymentProof.findFirst({
        where: {
          id: proofId,
          orderId,
          threadId,
          businessId: actor.businessId,
          isDeleted: false,
          order: { isDeleted: false },
          message: { isDeleted: false },
        },
        include: { order: true, message: { select: { mediaStatus: true } } },
      });
      if (!proof) throw new WhatsappError("WHATSAPP_RESOURCE_NOT_FOUND");
      if (
        proof.revision !== input.revision ||
        proof.order.version !== input.orderVersion ||
        !["DRAFT", "PENDING"].includes(proof.order.status) ||
        (input.status === "VALIDATED" && proof.message.mediaStatus !== "READY")
      )
        throw new WhatsappError("WHATSAPP_ORDER_CONFLICT");
      await tx.paymentProof.update({
        where: { id: proof.id },
        data: {
          status: input.status,
          revision: { increment: 1 },
          reviewedBy: actor.userId,
          reviewedAt: new Date(),
        },
      });
      const proofs = await tx.paymentProof.findMany({
        where: { businessId: actor.businessId, orderId, isDeleted: false },
        select: { status: true },
      });
      const paymentStatus = proofs.some((entry) => entry.status === "VALIDATED")
        ? "VALIDATED"
        : proofs.some((entry) => entry.status === "RECEIVED")
          ? "IN_REVIEW"
          : "REJECTED";
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus,
          version: { increment: 1 },
          confirmationToken: null,
          confirmationJobId: null,
        },
        include: orderInclude,
      });
      return orderView(order);
    });
  }
}
