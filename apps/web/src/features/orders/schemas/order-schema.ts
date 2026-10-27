import { z } from "zod";
import { paginationSchema } from "@/features/commerce/schemas/commerce-schema";
export const orderStatuses = ["DRAFT", "PENDING", "PAID", "SHIPPED", "CANCELLED"] as const;
export const orderInputSchema = z
  .object({
    clientId: z.uuid(),
    items: z
      .array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(10000) }))
      .min(1)
      .max(10),
  })
  .refine(
    (input) => new Set(input.items.map((line) => line.productId)).size === input.items.length,
    { path: ["items"], message: "Duplicate product" },
  );
export const orderSchema = z.object({
  id: z.uuid(),
  reference: z.string(),
  version: z.number(),
  clientId: z.uuid().nullable(),
  clientName: z.string().nullable(),
  threadId: z.uuid().nullable(),
  status: z.enum(orderStatuses),
  currency: z.string(),
  subtotal: z.string(),
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
export const ordersSchema = z.object({
  data: z.array(orderSchema),
  pagination: paginationSchema,
  summary: z.object({
    total: z.number(),
    draft: z.number(),
    pending: z.number(),
    paid: z.number(),
    shipped: z.number(),
    cancelled: z.number(),
  }),
});
export const orderResponseSchema = z.object({ data: orderSchema });
export type Order = z.infer<typeof orderSchema>;
export type OrderInput = z.infer<typeof orderInputSchema>;
export type OrderUpdate = {
  version: number;
  clientId?: string;
  items?: OrderInput["items"];
  status?: Order["status"];
};
