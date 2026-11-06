import { PrismaService } from "../../../database/prisma.service.js";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomBytes, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "../../../database/generated/client.js";
import type { AiReplyWork } from "../contracts/whatsapp-ai-store.js";
import type { AiToolCall, IAiToolExecutor, AiToolResult } from "../contracts/ai-tools.js";
import { toolDefinitions, toolSchemas } from "../dto/whatsapp-tools.js";
import { findAutomationAgent } from "./prisma-whatsapp-ai-agent.js";
import { orderInclude, orderView, type CommerceOrder } from "./whatsapp-order-view.js";
import { productSearchTerms } from "./whatsapp-product-search.js";
import { CommerceError } from "../../../common/commerce/commerce.js";
import { customerAddress } from "../../clients/repositories/client-address-store.js";
import { runAddressTool } from "./whatsapp-address-tools.js";
import { ToolInputError } from "./whatsapp-tool-error.js";
import { readGoogleMapsMessageBody, googleMapsMessageLocation } from "./google-maps-message.js";
import {
  GOOGLE_MAPS_LINK_RESOLVER,
  GoogleMapsLinkError,
  type IGoogleMapsLinkResolver,
} from "../contracts/google-maps-link-resolver.js";
import {
  parseGoogleMapsLocation,
  type GoogleMapsLocation,
} from "../models/google-maps-location.js";

type PreparedMapsMessage = { messageId: string; body: string; location: GoogleMapsLocation };

type Tx = Prisma.TransactionClient;

const paymentStatusLabels: Record<"es" | "en", Record<string, string>> = {
  es: {
    PENDING: "Pendiente",
    IN_REVIEW: "En revisión",
    VALIDATED: "Validado",
    REJECTED: "Rechazado",
  },
  en: {
    PENDING: "Pending",
    IN_REVIEW: "Under review",
    VALIDATED: "Validated",
    REJECTED: "Rejected",
  },
};

@Injectable()
export class PrismaWhatsappTools implements IAiToolExecutor {
  private readonly logger = new Logger(PrismaWhatsappTools.name);
  private readonly client: PrismaClient;
  readonly definitions = toolDefinitions;
  constructor(
    prismaService: PrismaService,
    @Inject(GOOGLE_MAPS_LINK_RESOLVER) private readonly mapsResolver: IGoogleMapsLinkResolver,
  ) {
    this.client = prismaService.client;
  }

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
      const preparation = await this.prepareMapsMessage(work, call, args);
      if (preparation && "cached" in preparation) return preparation.cached;
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
          const result = await this.run(tx, work, call.name, args, preparation?.source ?? null);
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
      if (error instanceof GoogleMapsLinkError) return { data: { error: error.code } };
      if (error instanceof ToolInputError || error instanceof CommerceError)
        return { data: { error: error.message } };
      // Never log Prisma messages/stacks: they can contain arguments and personal data.
      const code =
        error instanceof Prisma.PrismaClientValidationError
          ? "PRISMA_VALIDATION"
          : error instanceof Prisma.PrismaClientKnownRequestError && /^P\d{4}$/.test(error.code)
            ? error.code
            : "UNEXPECTED_TOOL_ERROR";
      this.logger.error({
        event: "whatsapp_ai_tool_failed",
        jobId: work.id,
        tool: call.name,
        code,
      });
      throw error;
    }
  }

  private async prepareMapsMessage(
    work: AiReplyWork,
    call: AiToolCall,
    input: unknown,
  ): Promise<{ cached: AiToolResult } | { source: PreparedMapsMessage | null } | null> {
    const messageId =
      call.name === "read_google_maps_location"
        ? toolSchemas.read_google_maps_location.parse(input).messageId
        : call.name === "set_delivery_details"
          ? toolSchemas.set_delivery_details.parse(input).locationMessageId
          : null;
    if (!messageId) return null;
    const preflight = await this.client.$transaction<
      { cached: AiToolResult } | { source: { messageId: string; body: string } | null }
    >(
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
          return { cached: previous.result as unknown as AiToolResult };
        }
        if (call.name === "set_delivery_details") {
          const args = toolSchemas.set_delivery_details.parse(input);
          if (args.mode !== "DELIVERY" || args.savedAddressId)
            throw new ToolInputError("AMBIGUOUS_DESTINATION");
          const order = await this.order(tx, work, args.orderId, args.version, true);
          const customer = await this.customer(tx, work);
          if (order.clientId !== customer.id) throw new ToolInputError("CUSTOMER_REQUIRED");
        }
        const message = await tx.whatsappInboundMessage.findFirst({
          where: {
            id: messageId,
            businessId: work.businessId,
            threadId: work.threadId,
            direction: "INBOUND",
            isDeleted: false,
          },
          select: { type: true, body: true },
        });
        if (!message) throw new ToolInputError("LOCATION_NOT_FOUND");
        if (message.type !== "text") {
          if (call.name === "read_google_maps_location")
            throw new ToolInputError("MAPS_MESSAGE_NOT_FOUND");
          return { source: null };
        }
        return { source: { messageId, body: message.body } };
      },
      { timeout: 10_000 },
    );
    if ("cached" in preflight) return { cached: preflight.cached };
    if (!preflight.source) return { source: null };
    const parsed = parseGoogleMapsLocation(preflight.source.body);
    let location: GoogleMapsLocation;
    if (parsed.ok) location = parsed.location;
    else if (parsed.reason === "MAPS_SHORT_URL_UNSUPPORTED") {
      // No transaction or business lock is held while contacting Google.
      const short = preflight.source.body
        .match(/https?:\/\/[^\s<>"']+/gi)![0]!
        .replace(/[.,;]+$/, "");
      location = googleMapsMessageLocation(await this.mapsResolver.resolve(short));
    } else throw new ToolInputError(parsed.reason);
    return { source: { ...preflight.source, location } };
  }

  private preparedMapsLocation(
    messageId: string,
    body: string,
    source: PreparedMapsMessage | null,
  ) {
    if (!source || source.messageId !== messageId || source.body !== body)
      throw new ToolInputError("MAPS_MESSAGE_CHANGED");
    return source.location;
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
    mapsSource: PreparedMapsMessage | null,
  ): Promise<AiToolResult> {
    const scope = { businessId: work.businessId, active: true, isDeleted: false };
    if (name === "search_products" || name === "get_product") {
      const where =
        name === "get_product"
          ? { id: toolSchemas.get_product.parse(input).productId }
          : (() => {
              const { query, availableOnly } = toolSchemas.search_products.parse(input);
              const terms = productSearchTerms(query);
              if (query && !terms.length) throw new ToolInputError("INVALID_SEARCH_QUERY");
              return {
                ...(availableOnly ? { stock: { gt: 0 } } : {}),
                AND: terms.map((term) => ({
                  OR: [
                    { name: { contains: term, mode: "insensitive" as const } },
                    { sku: { contains: term, mode: "insensitive" as const } },
                    { brand: { contains: term, mode: "insensitive" as const } },
                    { category: { contains: term, mode: "insensitive" as const } },
                  ],
                })),
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
    if (name === "read_google_maps_location") {
      const { messageId } = toolSchemas.read_google_maps_location.parse(input);
      return {
        data: {
          location: this.preparedMapsLocation(
            messageId,
            await readGoogleMapsMessageBody(tx, work, messageId),
            mapsSource,
          ),
          requiresCustomerConfirmation: true,
          addressVerified: false,
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
    if (
      ["list_customer_addresses", "request_address_change", "confirm_address_change"].includes(name)
    ) {
      const customer = await this.customer(tx, work);
      return runAddressTool(tx, work, customer.id, name, input);
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
        // The nested order relation supplies businessId through its composite FK.
        return {
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
        } satisfies Prisma.OrderItemUncheckedCreateWithoutOrderInput;
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
            deliveryFee: null,
            deliveryQuotedBy: null,
            deliveryQuotedAt: null,
            deliveryQuoteNote: "",
            deliveryQuoteStatus:
              existing.deliveryMode === "DELIVERY" ? "PENDING_HUMAN" : "NOT_REQUIRED",
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
      const order = await this.order(tx, work, args.orderId, args.version, true);
      const customer = await this.customer(tx, work);
      if (order.clientId !== customer.id) throw new ToolInputError("CUSTOMER_REQUIRED");
      if ((args.savedAddressId === null) !== (args.savedAddressVersion === null))
        throw new ToolInputError("ADDRESS_VERSION_REQUIRED");
      if (
        args.savedAddressId &&
        (args.mode !== "DELIVERY" || args.address || args.reference || args.locationMessageId)
      )
        throw new ToolInputError("AMBIGUOUS_DESTINATION");
      const saved = args.savedAddressId
        ? await customerAddress(
            tx,
            work.businessId,
            customer.id,
            args.savedAddressId,
            args.savedAddressVersion!,
          )
        : null;
      const location = args.locationMessageId
        ? await tx.whatsappInboundMessage.findFirst({
            where: {
              id: args.locationMessageId,
              businessId: work.businessId,
              threadId: work.threadId,
              isDeleted: false,
              direction: "INBOUND",
              OR: [
                {
                  type: "location",
                  locationLatitude: { not: null },
                  locationLongitude: { not: null },
                },
                { type: "text" },
              ],
            },
            omit: { mediaData: true },
          })
        : null;
      if (args.locationMessageId && !location) throw new ToolInputError("LOCATION_NOT_FOUND");
      const destinationLocation =
        location?.type === "text"
          ? this.preparedMapsLocation(location.id, location.body, mapsSource)
          : location
            ? {
                address: location.locationAddress,
                latitude: location.locationLatitude,
                longitude: location.locationLongitude,
              }
            : null;
      if (args.mode === "DELIVERY" && !args.address && !destinationLocation && !saved)
        throw new ToolInputError("DELIVERY_DESTINATION_REQUIRED");
      await tx.order.update({
        where: { id: args.orderId },
        data: {
          deliveryMode: args.mode,
          deliveryAddress:
            args.mode === "DELIVERY"
              ? saved
                ? [saved.address, saved.district, saved.city, saved.country]
                    .filter(Boolean)
                    .join(", ")
                : destinationLocation?.address || args.address || ""
              : "",
          deliveryReference: args.mode === "DELIVERY" ? (saved?.reference ?? args.reference) : "",
          deliveryLatitude:
            args.mode === "DELIVERY"
              ? (saved?.latitude ?? destinationLocation?.latitude ?? null)
              : null,
          deliveryLongitude:
            args.mode === "DELIVERY"
              ? (saved?.longitude ?? destinationLocation?.longitude ?? null)
              : null,
          deliveryFee: null,
          deliveryQuotedBy: null,
          deliveryQuotedAt: null,
          deliveryQuoteNote: "",
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
      this.validateDeliveryQuote(order);
      await this.validatePrices(tx, work, order);
      const token = randomBytes(5).toString("hex").toUpperCase();
      await tx.order.update({
        where: { id: order.id },
        data: { confirmationToken: token, confirmationJobId: work.id },
      });
      const view = orderView(order);
      const english = work.input.responseLanguage === "en";
      const command = `${english ? "CONFIRM" : "CONFIRMAR"} ${token}`;
      const text = [
        `${english ? "Order" : "Pedido"}: ${order.reference}`,
        ...view.items.map(
          (item) =>
            `${item.quantity} × ${item.name}: ${new Prisma.Decimal(item.unitPrice).mul(item.quantity).toFixed(2)} ${order.currency}`,
        ),
        `Subtotal: ${view.subtotal} ${order.currency}`,
        order.deliveryMode === "DELIVERY"
          ? `${english ? "Delivery" : "Entrega"}: ${order.deliveryAddress}\n${order.deliveryReference}\n${order.deliveryLatitude !== null ? `${order.deliveryLatitude}, ${order.deliveryLongitude}` : ""}\n${english ? "Delivery fee" : "Costo de envío"}: ${view.deliveryFee} ${order.currency}\n${order.deliveryQuoteNote}`
          : english
            ? "Pickup"
            : "Recojo",
        `${english ? "Total" : "Total"}: ${view.total} ${order.currency}`,
        english
          ? `Payment: ${paymentStatusLabels.en[order.paymentStatus] ?? "Status requires human review"}. A voucher does not verify payment.`
          : `Pago: ${paymentStatusLabels.es[order.paymentStatus] ?? "Estado requiere revisión humana"}. Un comprobante no acredita el pago.`,
        english ? "Stock not reserved." : "Sin reserva de stock.",
        `${english ? "To confirm this pending order, reply exactly:" : "Para confirmar este pedido pendiente, responde exactamente:"}\n${command}`,
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
        include: { inboxMessage: true },
      });
      const job = await tx.whatsappAiReplyJob.findUniqueOrThrow({
        where: { id: work.id },
        include: { triggerMessage: { select: { body: true, type: true, receivedAt: true } } },
      });
      // Use the command actually sent, even if the administrator changed language afterwards.
      const command = summary?.inboxMessage?.body.split("\n").at(-1);
      if (
        summary?.status !== "ACCEPTED" ||
        summary.isDeleted ||
        !summary.inboxMessage ||
        summary.inboxMessage.isDeleted ||
        summary.inboxMessage.threadId !== work.threadId ||
        summary.inboxMessage.direction !== "OUTBOUND" ||
        (command !== `CONFIRMAR ${order.confirmationToken}` &&
          command !== `CONFIRM ${order.confirmationToken}`) ||
        job.triggerMessage.type !== "text" ||
        job.triggerMessage.receivedAt <= summary.updatedAt ||
        job.triggerMessage.body.trim() !== command
      )
        throw new ToolInputError("EXPLICIT_CONFIRMATION_REQUIRED");
      this.validateDeliveryQuote(order);
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
        finalText:
          work.input.responseLanguage === "en"
            ? `Order registered: ${order.reference}. Payment and delivery remain subject to the summary status; this does not mean payment verified or dispatched.`
            : `Pedido registrado: ${order.reference}. Pago y entrega según el estado del resumen; no implica pago acreditado ni despacho.`,
      };
    }
    return { data: { error: "UNKNOWN_TOOL" } };
  }

  private validateDeliveryQuote(order: CommerceOrder) {
    if (
      order.deliveryMode === "DELIVERY" &&
      (order.deliveryQuoteStatus !== "QUOTED" ||
        order.deliveryFee === null ||
        order.deliveryFee.isNegative())
    )
      throw new ToolInputError(
        order.deliveryQuoteStatus === "REJECTED"
          ? "DELIVERY_NO_COVERAGE"
          : "DELIVERY_QUOTE_REQUIRED",
      );
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
