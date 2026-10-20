import { z } from "zod";
import { orderInputSchema, orderItemInputSchema } from "@/features/demo/schemas/workspace-schema";

export const orderDraftSchema = orderInputSchema.omit({ createdAt: true, currency: true }).extend({
  items: z
    .array(orderItemInputSchema.omit({ name: true }))
    .min(1, "required")
    .max(100, "text"),
});
export type OrderDraft = z.infer<typeof orderDraftSchema>;
