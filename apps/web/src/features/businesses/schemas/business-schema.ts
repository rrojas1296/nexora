import { z } from "zod";
import { currencies } from "@/lib/config/currency";

export const businessInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000),
  currency: z.enum(currencies),
  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }),
  contextDraft: z.string().trim().max(30000),
  agentName: z.string().trim().min(2).max(100),
  agentTone: z.enum(["friendly", "professional", "concise"]),
});
export const businessSchema = businessInputSchema
  .omit({ agentName: true, agentTone: true })
  .extend({
    id: z.uuid(),
    slug: z.string(),
    contextPublished: z.string(),
    contextVersion: z.number().int(),
    contextPublishedAt: z.iso.datetime().nullable(),
    revision: z.number().int(),
  });
export const businessResponseSchema = z.object({ data: businessSchema });
export type Business = z.infer<typeof businessSchema>;
export type BusinessInput = z.infer<typeof businessInputSchema>;
export type BusinessScope = { userId: string; businessId: string };
