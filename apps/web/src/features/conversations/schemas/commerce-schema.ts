import { z } from "zod";

export const conversationOrderSchema = z.object({
  id: z.uuid(),
  reference: z.string(),
  version: z.number().int(),
  status: z.enum(["DRAFT", "PENDING", "PAID", "SHIPPED", "CANCELLED"]),
  currency: z.string(),
  subtotal: z.string(),
  paymentStatus: z.enum(["PENDING", "IN_REVIEW", "VALIDATED", "REJECTED"]),
  deliveryMode: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string(),
  deliveryReference: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  deliveryQuoteStatus: z.enum(["NOT_REQUIRED", "PENDING_HUMAN"]),
  items: z.array(
    z.object({
      productId: z.uuid(),
      name: z.string(),
      quantity: z.number().int(),
      unitPrice: z.string(),
    }),
  ),
  proofs: z.array(
    z.object({
      id: z.uuid(),
      messageId: z.uuid(),
      status: z.enum(["RECEIVED", "VALIDATED", "REJECTED"]),
      revision: z.number().int(),
    }),
  ),
});
export const conversationOrdersResponse = z.object({
  data: z.object({ items: z.array(conversationOrderSchema), nextCursor: z.uuid().nullable() }),
});
export const conversationOrderResponse = z.object({ data: conversationOrderSchema });
export type ConversationOrder = z.infer<typeof conversationOrderSchema>;
export type ReviewProofInput = {
  status: "VALIDATED" | "REJECTED";
  revision: number;
  orderVersion: number;
};
