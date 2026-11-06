import { z } from "zod";
import { commercePagination, commerceQuery } from "../../../common/commerce/commerce-http.js";
export const orderStatus = z.enum(["DRAFT", "PENDING", "PAID", "SHIPPED", "CANCELLED"]);
const lines = z
  .array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(10000) }).strict())
  .min(1)
  .max(10)
  .refine(
    (items) => new Set(items.map((item) => item.productId)).size === items.length,
    "Duplicate product",
  );
export const orderCreate = z.object({ id: z.uuid(), clientId: z.uuid(), items: lines }).strict();
export const orderUpdate = z
  .object({
    version: z.number().int().min(0),
    clientId: z.uuid().optional(),
    items: lines.optional(),
    status: orderStatus.optional(),
    deliveryQuote: z
      .object({
        status: z.enum(["QUOTED", "REJECTED"]),
        fee: z
          .string()
          .regex(/^\d{1,12}(\.\d{1,2})?$/)
          .nullable(),
        note: z.string().trim().max(1024),
      })
      .strict()
      .refine((quote) => (quote.status === "QUOTED" ? quote.fee !== null : quote.fee === null))
      .optional(),
  })
  .strict()
  .refine(
    (input) =>
      input.clientId !== undefined ||
      input.items !== undefined ||
      input.status !== undefined ||
      input.deliveryQuote !== undefined,
    "No changes",
  );
export const ordersQuery = commerceQuery.extend({
  status: orderStatus.optional(),
  clientId: z.uuid().optional(),
});
export const orderView = z.object({
  id: z.uuid(),
  reference: z.string(),
  version: z.number(),
  clientId: z.uuid().nullable(),
  clientName: z.string().nullable(),
  threadId: z.uuid().nullable(),
  status: orderStatus,
  currency: z.string(),
  subtotal: z.string(),
  deliveryFee: z.string().nullable(),
  total: z.string().nullable(),
  deliveryQuoteNote: z.string(),
  placedAt: z.string(),
  paymentStatus: z.string(),
  deliveryMode: z.string(),
  deliveryAddress: z.string(),
  deliveryReference: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  deliveryQuoteStatus: z.string(),
  items: z.array(
    z.object({
      productId: z.uuid(),
      name: z.string(),
      quantity: z.number(),
      unitPrice: z.string(),
    }),
  ),
});
export const orderResponse = z.object({ data: orderView });
export const ordersResponse = z.object({
  data: z.array(orderView),
  pagination: commercePagination,
  summary: z.object({
    total: z.number(),
    draft: z.number(),
    pending: z.number(),
    paid: z.number(),
    shipped: z.number(),
    cancelled: z.number(),
  }),
});
