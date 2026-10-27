import { z } from "zod";
import { paginationSchema } from "@/features/commerce/schemas/commerce-schema";
export const clientSegments = ["retail", "wholesale", "vip"] as const;
export const clientCountries = ["PE", "US", "MX", "CO", "CL", "AR", "EC", "ES"] as const;
export const clientInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.union([z.literal(""), z.email().max(254)]),
  phone: z.string().regex(/^\+[1-9]\d{4,19}$/),
  company: z.string().max(160),
  taxId: z.string().max(80),
  segment: z.enum(clientSegments),
  active: z.boolean(),
  address: z.string().max(500),
  city: z.string().max(100),
  region: z.string().max(100),
  postalCode: z.string().max(32),
  country: z.union([z.literal("none"), z.string().regex(/^[A-Z]{2}$/)]),
  language: z.enum(["es", "en"]),
  notes: z.string().max(5000),
  marketingConsent: z.boolean(),
});
export const clientSchema = clientInputSchema.extend({
  id: z.uuid(),
  version: z.number().int(),
  email: z.string().nullable(),
  country: z.string().nullable(),
  createdAt: z.string(),
  ordersCount: z.number().int(),
});
export const clientsSchema = z.object({
  data: z.array(clientSchema),
  pagination: paginationSchema,
  summary: z.object({ total: z.number(), active: z.number(), vip: z.number() }),
});
export const clientResponseSchema = z.object({ data: clientSchema });
export type ClientInput = z.infer<typeof clientInputSchema>;
export type Client = z.infer<typeof clientSchema>;
