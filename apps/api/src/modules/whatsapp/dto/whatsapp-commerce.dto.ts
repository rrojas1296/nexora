import { z } from "zod";

export const commerceOrderSchema = z.object({
  id: z.uuid(),
  reference: z.string(),
  version: z.number().int(),
  status: z.enum(["DRAFT", "PENDING", "PAID", "SHIPPED", "CANCELLED"]),
  currency: z.string(),
  subtotal: z.string(),
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
      quantity: z.number().int(),
      unitPrice: z.string(),
    }),
  ),
  proofs: z.array(
    z.object({ id: z.uuid(), messageId: z.uuid(), status: z.string(), revision: z.number().int() }),
  ),
});
export const commercePageSchema = z.object({
  items: z.array(commerceOrderSchema),
  nextCursor: z.uuid().nullable(),
});
export const reviewProofSchema = z.strictObject({
  status: z.enum(["VALIDATED", "REJECTED"]),
  revision: z.number().int().nonnegative(),
  orderVersion: z.number().int().nonnegative(),
});
