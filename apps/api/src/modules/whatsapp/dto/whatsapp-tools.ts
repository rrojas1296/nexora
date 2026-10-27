import { z } from "zod";

const version = z.number().int().nonnegative();
const order = { orderId: z.uuid(), version };
export const toolSchemas = {
  get_customer: z.strictObject({}),
  ensure_customer: z.strictObject({
    name: z.string().trim().min(2).max(160),
    email: z.email().max(254).nullable(),
  }),
  search_products: z.strictObject({
    query: z.string().trim().max(120),
    availableOnly: z.boolean(),
  }),
  get_product: z.strictObject({ productId: z.uuid() }),
  get_order_draft: z.strictObject({ orderId: z.uuid().nullable() }),
  prepare_order: z.strictObject({
    orderId: z.uuid().nullable(),
    version: version.nullable(),
    items: z
      .array(z.strictObject({ productId: z.uuid(), quantity: z.number().int().min(1).max(100) }))
      .min(1)
      .max(10),
  }),
  set_delivery_details: z.strictObject({
    ...order,
    mode: z.enum(["PICKUP", "DELIVERY"]),
    locationMessageId: z.uuid().nullable(),
    address: z.string().trim().max(2048),
    reference: z.string().trim().max(1024),
  }),
  get_delivery_quote: z.strictObject({ orderId: z.uuid() }),
  attach_payment_proof: z.strictObject({ ...order, messageId: z.uuid() }),
  get_payment_status: z.strictObject({ orderId: z.uuid() }),
  request_order_confirmation: z.strictObject(order),
  confirm_order: z.strictObject(order),
};
const descriptions: Record<keyof typeof toolSchemas, string> = {
  get_customer:
    "Read only the active customer linked to this WhatsApp conversation. No global customer search. If absent, ask the customer's name before ensure_customer.",
  ensure_customer:
    "Create or link a customer for this conversation using a name the customer provided (email optional, null if absent). Phone is taken by the server from the WhatsApp sender, never from model arguments. Does not overwrite an existing profile or grant marketing consent. Ambiguous/inactive matches require human help. Required before preparing/confirming orders. May invalidate existing draft versions: read orders again after linking.",
  search_products:
    'Query the real database catalog. REQUIRED before answering questions about products, catalog, prices, stock or availability. For general questions like "¿qué productos tienes disponibles?" or "what do you sell?", pass query: "" to browse; do not search for generic words like "productos" or "disponibles". For specific searches pass only the product name, SKU or category. Set availableOnly: true for in-stock/available products, false when also checking sold-out products. Returns up to five products and hasMore; a partial list is not the entire catalog.',
  get_product: "Read one active product from this business. Stock is not reserved.",
  get_order_draft:
    "Read a conversation order; with null orderId list up to five recent orders. Never guess which order a customer means.",
  prepare_order:
    "Create a draft (null orderId/version) or replace all items of an existing draft at the given version. Server computes prices. Does not confirm, pay or reserve stock.",
  set_delivery_details:
    "Update draft delivery details. Coordinates are only taken from a native location message in this conversation. Ask whether the location is the delivery destination. Delivery price/coverage remain pending human quotation.",
  get_delivery_quote:
    "Read delivery quotation status. No automatic coverage or price calculation exists yet.",
  attach_payment_proof:
    "Attach an image/document message from this conversation to the selected order. Does not validate payment or read the file contents. Ask which order if ambiguous.",
  get_payment_status: "Read payment proof review status; RECEIVED is not a validated payment.",
  request_order_confirmation:
    "Present authoritative order summary and an exact confirmation command. Ends this turn. Must be used before confirming.",
  confirm_order:
    "Confirm only when the current customer message exactly matches the command in a previously accepted summary for this version. Never manufacture confirmation.",
};
export const toolDefinitions = Object.entries(toolSchemas).map(([name, schema]) => ({
  name,
  description: descriptions[name as keyof typeof toolSchemas],
  parameters: z.toJSONSchema(schema),
}));
