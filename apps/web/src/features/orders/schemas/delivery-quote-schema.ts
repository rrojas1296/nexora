import { z } from "zod";
export const deliveryQuoteSchema = z
  .object({
    status: z.enum(["QUOTED", "REJECTED"]),
    fee: z.string().trim(),
    note: z.string().trim().max(1024),
  })
  .refine((value) => value.status === "REJECTED" || /^\d{1,12}(\.\d{1,2})?$/.test(value.fee), {
    path: ["fee"],
    message: "Invalid delivery fee",
  });
export type DeliveryQuoteInput = z.infer<typeof deliveryQuoteSchema>;
