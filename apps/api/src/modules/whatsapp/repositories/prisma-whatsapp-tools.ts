import { randomBytes, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "../../../database/generated/client.js";
import type { AiReplyWork } from "../contracts/whatsapp-ai-store.js";
import type { AiToolCall, AiToolExecutor, AiToolResult } from "../contracts/ai-tools.js";
import { toolDefinitions, toolSchemas } from "../dto/whatsapp-tools.js";
import { findAutomationAgent } from "./prisma-whatsapp-ai-agent.js";

import { orderInclude, orderView, type CommerceOrder } from "./whatsapp-order-view.js";

type Tx = Prisma.TransactionClient;

class ToolInputError extends Error {}

export class PrismaWhatsappTools implements AiToolExecutor {
  readonly definitions = toolDefinitions;
  constructor(private readonly client: PrismaClient) {}

  async execute(work: AiReplyWork, call: AiToolCall): Promise<AiToolResult> {
    if (call.arguments.length > 16_384 || !Object.hasOwn(toolSchemas, call.name))
      return { data: { error: "INVALID_TOOL" } };
    const schema = toolSchemas[call.name as keyof typeof toolSchemas];
    let args: unknown;
    try {
      args = JSON.parse(call.arguments);
    } catch {
      return { data: { error: "INVALID_ARGUMENTS" } };
    }
    if (!schema.safeParse(args).success) return { data: { error: "INVALID_ARGUMENTS" } };
    try {
      return await this.client.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT "id" FROM "Businesses" WHERE "id" = ${work.businessId}::uuid FOR NO KEY UPDATE`;
          await this.validateWork(tx, work);
          const previous = await tx.whatsappToolExecution.findUnique({
            where: {
              businessId_jobId_callId: {
                businessId: work.businessId,
                jobId: work.id,
                callId: call.id,
              },
            },
          });
          if (previous) {
            if (previous.isDeleted || previous.name !== call.name)
              throw new ToolInputError("CALL_ID_CONFLICT");
            return previous.result as unknown as AiToolResult;
          }
          const result = await this.run(tx, work, call.name, args);
          await tx.whatsappToolExecution.create({
            data: {
              businessId: work.businessId,
              jobId: work.id,
              callId: call.id,
              name: call.name,
              result: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
            },
          });
          return result;
        },
        { timeout: 10_000 },
      );
    } catch (error) {
      if (error instanceof ToolInputError) return { data: { error: error.message } };
      throw error;
    }
  }

  private async validateWork(tx: Tx, work: AiReplyWork) {
    const [job, thread, business, agent, connection] = await Promise.all([
      tx.whatsappAiReplyJob.findFirst({
        where: {
          id: work.id,
          businessId: work.businessId,
          isDeleted: false,
          status: "GENERATING",
          startedAt: { gt: new Date(Date.now() - 100_000) },
          triggerMessage: {
            is: {
              isDeleted: false,
              sentAt: { lte: new Date(), gt: new Date(Date.now() - 86_400_000) },
            },
          },
        },
      }),
      tx.whatsappThread.findFirst({
        where: {
          id: work.threadId,
          businessId: work.businessId,
          isDeleted: false,
          controlMode: "AI",
          controlVersion: work.threadVersion,
        },
      }),
      tx.business.findFirst({
        where: { id: work.businessId, isDeleted: false, contextVersion: work.contextVersion },
      }),
      findAutomationAgent(tx, work.businessId),
      tx.whatsappConnection.findFirst({
        where: {
          businessId: work.businessId,
          isDeleted: false,
          updatedAt: work.connectionUpdatedAt,
          encryptedAccessToken: { not: null },
        },
      }),
    ]);
    if (
      !job ||
      !thread ||
      !business ||
      !agent ||
      agent.updatedAt.getTime() !== work.agentUpdatedAt.getTime() ||
      !connection ||
      thread.phoneNumberId !== connection.phoneNumberId
    )
      throw new ToolInputError("WORK_NO_LONGER_ELIGIBLE");
  }

  private async customer(tx: Tx, work: AiReplyWork) {
    const thread = await tx.whatsappThread.findFirstOrThrow({
      where: { id: work.threadId, businessId: work.businessId, isDeleted: false },
    });
    const customer = thread.clientId
      ? await tx.client.findFirst({
          where: {
            id: thread.clientId,
            businessId: work.businessId,
            isDeleted: false,
            active: true,
            phone: `+${thread.contactWaId}`,
          },
        })
      : null;
    if (!customer) throw new ToolInputError("CUSTOMER_REQUIRED");
    return customer;
  }

  private async order(tx: Tx, work: AiReplyWork, id: string, version?: number, draftOnly = false) {
    const order = await tx.order.findFirst({
      where: { id, businessId: work.businessId, threadId: work.threadId, isDeleted: false },
      include: orderInclude,
    });
    if (!order) throw new ToolInputError("ORDER_NOT_FOUND");
    if (version !== undefined && order.version !== version)
      throw new ToolInputError("ORDER_VERSION_CONFLICT");
    if (draftOnly && order.status !== "DRAFT") throw new ToolInputError("ORDER_NOT_DRAFT");
    return order;
  }

  private async run(
    tx: Tx,
    work: AiReplyWork,
    name: string,
    input: unknown,
  ): Promise<AiToolResult> {
    const scope = { businessId: work.businessId, active: true, isDeleted: false };
    if (name === "search_products" || name === "get_product") {
      const where =
        name === "get_product"
          ? { id: toolSchemas.get_product.parse(input).productId }
          : (() => {
              const { query, availableOnly } = toolSchemas.search_products.parse(input);
              const term = query.replace(/[\\%_]/g, "\\$&");
              return {
                ...(availableOnly ? { stock: { gt: 0 } } : {}),
                ...(term
                  ? {
                      OR: [
                        { name: { contains: term, mode: "insensitive" as const } },
                        { sku: { contains: term, mode: "insensitive" as const } },
                        { category: { contains: term, mode: "insensitive" as const } },
                      ],
                    }
                  : {}),
              };
            })();
      const products = await tx.product.findMany({
        where: { ...scope, ...where },
        take: 6,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          sku: true,
          category: true,
          description: true,
          price: true,
          currency: true,
          stock: true,
        },
      });
      return {
        data: {
          hasMore: products.length > 5,
          products: products.slice(0, 5).map((product) => ({
            ...product,
            description: product.description.slice(0, 1000),
            price: product.price.toFixed(2),
            available: product.stock > 0,
          })),
        },
      };
    }
    if (name === "get_customer" || name === "ensure_customer") {
      const thread = await tx.whatsappThread.findFirstOrThrow({
        where: { id: work.threadId, businessId: work.businessId, isDeleted: false },
      });
      let customer = thread.clientId
        ? await tx.client.findFirst({ where: { id: thread.clientId, ...scope } })
        : null;
      if (thread.clientId && (!customer || customer.phone !== `+${thread.contactWaId}`))
        throw new ToolInputError("CUSTOMER_REQUIRES_HUMAN_REVIEW");
      if (!customer && name === "ensure_customer") {
        const args = toolSchemas.ensure_customer.parse(input);
        const matches = await tx.client.findMany({
          where: { businessId: work.businessId, isDeleted: false, phone: `+${thread.contactWaId}` },
          take: 2,
        });
        if (matches.length > 1 || matches.some((row) => !row.active))
          throw new ToolInputError("CUSTOMER_REQUIRES_HUMAN_REVIEW");
        customer = matches[0] ?? null;
        if (!customer) {
          const email = args.email?.trim().toLowerCase() ?? null;
          if (
            email &&
            (await tx.client.findUnique({
              where: { businessId_email: { businessId: work.businessId, email } },
            }))
          )
            throw new ToolInputError("CUSTOMER_REQUIRES_HUMAN_REVIEW");
          customer = await tx.client.create({
            data: {
              businessId: work.businessId,
              name: args.name,
              email,
              phone: `+${thread.contactWaId}`,
              country: null,
              marketingConsent: false,
            },
          });
        }
        await tx.whatsappThread.update({
          where: { id: thread.id },
          data: { clientId: customer.id },
        });
        await tx.order.updateMany({
          where: {
            businessId: work.businessId,
            threadId: work.threadId,
            isDeleted: false,
            status: "DRAFT",
            clientId: null,
          },
          data: {
            clientId: customer.id,
            version: { increment: 1 },
            confirmationToken: null,
            confirmationJobId: null,
          },
        });
      }
      return { data: { customer: customer ? { id: customer.id, name: customer.name } : null } };
    }
    if (name === "get_order_draft") {
      const { orderId } = toolSchemas.get_order_draft.parse(input);
      if (orderId) return { data: { order: orderView(await this.order(tx, work, orderId)) } };
      const orders = await tx.order.findMany({
        where: { businessId: work.businessId, threadId: work.threadId, isDeleted: false },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 5,
        include: orderInclude,
      });
      return { data: { orders: orders.map(orderView) } };
    }
    if (name === "prepare_order") {
      const args = toolSchemas.prepare_order.parse(input);
      if (new Set(args.items.map((item) => item.productId)).size !== args.items.length)
        throw new ToolInputError("DUPLICATE_PRODUCT");
      const customer = await this.customer(tx, work);
      const business = await tx.business.findUniqueOrThrow({ where: { id: work.businessId } });
      const products = await tx.product.findMany({
        where: {
          ...scope,
          id: { in: args.items.map((item) => item.productId) },
          currency: business.currency,
        },
      });
      if (products.length !== args.items.length) throw new ToolInputError("PRODUCT_UNAVAILABLE");
      const items = args.items.map((item) => {
        const product = products.find((entry) => entry.id === item.productId)!;
        if (product.stock < item.quantity) throw new ToolInputError("INSUFFICIENT_STOCK");
        return {
          businessId: work.businessId,
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      });
      let id: string;
      if (args.orderId) {
        if (args.version === null) throw new ToolInputError("VERSION_REQUIRED");
        const existing = await this.order(tx, work, args.orderId, args.version, true);
        id = existing.id;
        await tx.orderItem.updateMany({
          where: { businessId: work.businessId, orderId: id, isDeleted: false },
          data: { isDeleted: true },
        });
        await tx.order.update({
          where: { id },
          data: {
            clientId: customer.id,
            version: { increment: 1 },
            confirmationToken: null,
            confirmationJobId: null,
            items: { create: items },
          },
        });
      } else {
        const existing = await tx.order.findFirst({
          where: {
            businessId: work.businessId,
            threadId: work.threadId,
            status: "DRAFT",
            isDeleted: false,
          },
        });
        if (existing) throw new ToolInputError("DRAFT_ALREADY_EXISTS_USE_GET_ORDER_DRAFT");
        const created = await tx.order.create({
          data: {
            businessId: work.businessId,
            threadId: work.threadId,
            clientId: customer.id,
            reference: `WA-${randomUUID()}`,
            currency: business.currency,
            status: "DRAFT",
            items: { create: items },
          },
        });
        id = created.id;
      }
      return { data: { order: orderView(await this.order(tx, work, id)), stockReserved: false } };
    }
    if (name === "set_delivery_details") {
      const args = toolSchemas.set_delivery_details.parse(input);
      await this.order(tx, work, args.orderId, args.version, true);
      const location = args.locationMessageId
        ? await tx.whatsappInboundMessage.findFirst({
            where: {
              id: args.locationMessageId,
              businessId: work.businessId,
              threadId: work.threadId,
              isDeleted: false,
              direction: "INBOUND",
              type: "location",
              locationLatitude: { not: null },
              locationLongitude: { not: null },
            },
            omit: { mediaData: true },
          })
        : null;
      if (args.locationMessageId && !location) throw new ToolInputError("LOCATION_NOT_FOUND");
      if (args.mode === "DELIVERY" && !args.address && !location)
        throw new ToolInputError("DELIVERY_DESTINATION_REQUIRED");
      await tx.order.update({
        where: { id: args.orderId },
        data: {
          deliveryMode: args.mode,
          deliveryAddress:
            args.mode === "DELIVERY" ? args.address || location?.locationAddress || "" : "",
          deliveryReference: args.mode === "DELIVERY" ? args.reference : "",
          deliveryLatitude: args.mode === "DELIVERY" ? (location?.locationLatitude ?? null) : null,
          deliveryLongitude:
            args.mode === "DELIVERY" ? (location?.locationLongitude ?? null) : null,
          deliveryQuoteStatus: args.mode === "DELIVERY" ? "PENDING_HUMAN" : "NOT_REQUIRED",
          version: { increment: 1 },
          confirmationToken: null,
          confirmationJobId: null,
        },
      });
      return { data: { order: orderView(await this.order(tx, work, args.orderId)) } };
    }
    if (name === "attach_payment_proof") {
      const args = toolSchemas.attach_payment_proof.parse(input);
      const order = await this.order(tx, work, args.orderId, args.version);
      if (!["DRAFT", "PENDING"].includes(order.status)) throw new ToolInputError("ORDER_CLOSED");
      const message = await tx.whatsappInboundMessage.findFirst({
        where: {
          id: args.messageId,
          businessId: work.businessId,
          threadId: work.threadId,
          direction: "INBOUND",
          isDeleted: false,
          type: { in: ["image", "document"] },
          mediaId: { not: null },
        },
        select: { id: true },
      });
      if (!message) throw new ToolInputError("PROOF_MESSAGE_NOT_FOUND");
      const existing = await tx.paymentProof.findUnique({
        where: { businessId_messageId: { businessId: work.businessId, messageId: message.id } },
      });
      if (existing && (existing.orderId !== order.id || existing.isDeleted))
        throw new ToolInputError("PROOF_ALREADY_LINKED");
      if (!existing) {
        if (order.proofs.length >= 20) throw new ToolInputError("PROOF_LIMIT_REACHED");
        await tx.paymentProof.create({
          data: {
            businessId: work.businessId,
            orderId: order.id,
            threadId: work.threadId,
            messageId: message.id,
          },
        });
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: order.paymentStatus === "VALIDATED" ? "VALIDATED" : "IN_REVIEW",
            version: { increment: 1 },
            confirmationToken: null,
            confirmationJobId: null,
          },
        });
      }
      return {
        data: {
          order: orderView(await this.order(tx, work, order.id)),
          paymentValidatedByAttachment: false,
        },
      };
    }
    if (name === "get_payment_status" || name === "get_delivery_quote") {
      const { orderId } = toolSchemas.get_payment_status.parse(input);
      return { data: { order: orderView(await this.order(tx, work, orderId)) } };
    }
    if (name === "request_order_confirmation") {
      const args = toolSchemas.request_order_confirmation.parse(input);
      const order = await this.order(tx, work, args.orderId, args.version, true);
      const customer = await this.customer(tx, work);
      if (order.clientId !== customer.id) throw new ToolInputError("CUSTOMER_REQUIRED");
      await this.validatePrices(tx, work, order);
      const token = randomBytes(5).toString("hex").toUpperCase();
      await tx.order.update({
        where: { id: order.id },
        data: { confirmationToken: token, confirmationJobId: work.id },
      });
      const view = orderView(order);
      const text = [
        `Pedido / Order: ${order.reference}`,
        ...view.items.map(
          (item) =>
            `${item.quantity} × ${item.name}: ${new Prisma.Decimal(item.unitPrice).mul(item.quantity).toFixed(2)} ${order.currency}`,
        ),
        `Subtotal: ${view.subtotal} ${order.currency}`,
        order.deliveryMode === "DELIVERY"
          ? `Delivery: ${order.deliveryAddress}\n${order.deliveryReference}\n${order.deliveryLatitude !== null ? `${order.deliveryLatitude}, ${order.deliveryLongitude}` : ""}\nTarifa y cobertura pendientes de revisión / Fee and coverage pending review. Subtotal excludes delivery.`
          : "Recojo / Pickup",
        `Pago / Payment: ${order.paymentStatus}. Un voucher no acredita el pago / A voucher does not verify payment.`,
        `Sin reserva de stock / Stock not reserved.`,
        `Para confirmar este pedido pendiente, responde exactamente / To confirm this pending order, reply exactly:\nCONFIRMAR ${token}`,
      ].join("\n");
      if (text.length > 4096) throw new ToolInputError("SUMMARY_TOO_LONG");
      return { data: { order: view }, finalText: text };
    }
    if (name === "confirm_order") {
      const args = toolSchemas.confirm_order.parse(input);
      const order = await this.order(tx, work, args.orderId, args.version);
      const customer = await this.customer(tx, work);
      if (order.clientId !== customer.id) throw new ToolInputError("CUSTOMER_REQUIRED");
      if (order.status === "PENDING")
        return { data: { order: orderView(order), alreadyConfirmed: true } };
      if (order.status !== "DRAFT" || !order.confirmationToken || !order.confirmationJobId)
        throw new ToolInputError("PRESENT_SUMMARY_FIRST");
      const summary = await tx.whatsappSendAttempt.findUnique({
        where: {
          businessId_idempotencyKey: {
            businessId: work.businessId,
            idempotencyKey: order.confirmationJobId,
          },
        },
      });
      const job = await tx.whatsappAiReplyJob.findUniqueOrThrow({
        where: { id: work.id },
        include: { triggerMessage: { select: { body: true, type: true, receivedAt: true } } },
      });
      if (
        summary?.status !== "ACCEPTED" ||
        job.triggerMessage.type !== "text" ||
        job.triggerMessage.receivedAt <= summary.updatedAt ||
        job.triggerMessage.body.trim() !== `CONFIRMAR ${order.confirmationToken}`
      )
        throw new ToolInputError("EXPLICIT_CONFIRMATION_REQUIRED");
      await this.validatePrices(tx, work, order);
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PENDING",
          placedAt: new Date(),
          version: { increment: 1 },
          confirmationToken: null,
          confirmationJobId: null,
        },
      });
      return {
        data: { order: orderView(await this.order(tx, work, order.id)), stockReserved: false },
        finalText: `Pedido registrado / Order registered: ${order.reference}. Pago y entrega según el estado del resumen; no implica pago acreditado ni despacho / Payment and delivery remain subject to the summary status; this does not mean payment verified or dispatched.`,
      };
    }
    return { data: { error: "UNKNOWN_TOOL" } };
  }

  private async validatePrices(tx: Tx, work: AiReplyWork, order: CommerceOrder) {
    if (!order.items.length) throw new ToolInputError("EMPTY_ORDER");
    const products = await tx.product.findMany({
      where: {
        businessId: work.businessId,
        id: { in: order.items.map((item) => item.productId) },
        active: true,
        isDeleted: false,
      },
    });
    for (const item of order.items) {
      const product = products.find((entry) => entry.id === item.productId);
      if (
        !product ||
        product.currency !== order.currency ||
        !product.price.equals(item.unitPrice) ||
        product.name !== item.productName ||
        product.stock < item.quantity
      )
        throw new ToolInputError("CATALOG_CHANGED_REFRESH_DRAFT_AND_CONFIRM_AGAIN");
    }
  }
}
