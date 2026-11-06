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
  list_customer_addresses: z.strictObject({}),
  request_address_change: z.strictObject({
    operation: z.enum(["SAVE", "UPDATE", "REMOVE"]),
    addressId: z.uuid().nullable(),
    addressVersion: version.nullable(),
    orderId: z.uuid().nullable(),
    orderVersion: version.nullable(),
    label: z.string().trim().max(80),
    country: z.string().trim().max(80),
    city: z.string().trim().max(120),
    district: z.string().trim().max(120),
    isDefault: z.boolean(),
  }),
  confirm_address_change: z.strictObject({ actionId: z.uuid() }),
  read_google_maps_location: z.strictObject({ messageId: z.uuid() }),
  set_delivery_details: z.strictObject({
    ...order,
    savedAddressId: z.uuid().nullable(),
    savedAddressVersion: version.nullable(),
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
    'Query the real database catalog. REQUIRED before answering questions about products, catalog, prices, stock or availability. For general questions like "¿qué productos tienes disponibles?" or "what do you sell?", pass query: "" to browse; do not search for generic words like "productos" or "disponibles". For specific searches pass only product name/model, SKU, brand or category terms, not a full question. Words can match across those fields in any order; storage variants like 128gb and 128 GB are supported. All meaningful words must match; this is not a synonym or typo search. Set availableOnly: true for in-stock/available products, false when also checking sold-out products. Returns up to five products and hasMore; a partial list is not the entire catalog.',
  get_product: "Read one active product from this business. Stock is not reserved.",
  get_order_draft:
    "Read a conversation order; with null orderId list up to five recent orders. Never guess which order a customer means.",
  prepare_order:
    "Create a draft (null orderId/version) or replace all items of an existing draft at the given version. Server computes prices. Does not confirm, pay or reserve stock.",
  list_customer_addresses:
    "List only this conversation customer's saved addresses and pending address confirmation action ID. Offer a default, never silently select it. Required before choosing or changing a saved address.",
  request_address_change:
    "Ask separate permission to SAVE, UPDATE or REMOVE a saved address. SAVE/UPDATE copy destination from the customer's DELIVERY draft at orderId/orderVersion; label required. UPDATE/REMOVE require addressId/addressVersion. Null unused IDs/versions, empty unused text. Does not save yet. Returns a server summary and exact command; ends turn. Never imply using delivery means consent to store it.",
  confirm_address_change:
    "Apply the pending address action ONLY when the current inbound customer text exactly matches the ADDRESS/DIRECCION command in the accepted server summary. Read actionId from list_customer_addresses. Never manufacture consent.",
  read_google_maps_location:
    "Read a Google Maps URL from an actual inbound text message in this conversation by messageId. Long URLs are parsed locally; short maps.app.goo.gl and goo.gl/maps URLs are expanded by a bounded server resolver restricted to Google redirects, without reading HTML. Extracts explicit place/query coordinates and unverified place label; never uses @ map-center coordinates. Multiple/conflicting points or unsupported/unresolvable links require native WhatsApp location or a written address. MAPS_LINK_TIMEOUT, MAPS_LINK_UNRESOLVED and MAPS_REDIRECT_BLOCKED mean the short link could not be resolved, not that the customer's address is invalid. Do not retry automatically or say you cannot read all shared Maps links. A successful parse is not destination confirmation. Present the label/pin and ask the customer to confirm destination and arrival instructions before set_delivery_details. Never invent missing street/city/country.",
  set_delivery_details:
    "Update draft destination, never saves it to the address book. For a saved address pass savedAddressId/savedAddressVersion and no location/text; otherwise null saved IDs and use customer text or locationMessageId from a native location OR the inbound text Google Maps message previously read with read_google_maps_location. Server re-parses Maps message and uses its place label/coordinates, never coordinates from model arguments. Ask customer to select/confirm destination, including a default or Maps link, before using it. Any update invalidates quote and summary. Delivery requires human quote before purchase confirmation.",
  get_delivery_quote:
    "Read delivery quotation status, fee and total. PENDING_HUMAN is not free. REJECTED means no coverage; offer pickup/human help. Human quotes do not automatically send messages. Read status on the next customer message; no automatic price calculation exists.",
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
