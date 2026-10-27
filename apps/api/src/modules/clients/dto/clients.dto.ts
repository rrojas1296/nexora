import { z } from "zod";
import { commercePagination } from "../../../common/commerce/commerce-http.js";
export const clientFields = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.email().trim().toLowerCase().max(254).nullable(),
  phone: z.string().regex(/^\+[1-9]\d{4,19}$/),
  company: z.string().trim().max(160).default(""),
  taxId: z.string().trim().max(80).default(""),
  segment: z.enum(["retail", "wholesale", "vip"]).default("retail"),
  active: z.boolean().default(true),
  address: z.string().trim().max(500).default(""),
  city: z.string().trim().max(100).default(""),
  region: z.string().trim().max(100).default(""),
  postalCode: z.string().trim().max(32).default(""),
  country: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
  language: z.enum(["es", "en"]).default("es"),
  notes: z.string().trim().max(5000).default(""),
  marketingConsent: z.boolean().default(false),
});
export const clientCreate = clientFields.extend({ id: z.uuid() }).strict();
export const clientUpdate = clientFields.extend({ version: z.number().int().min(0) }).strict();
export const clientView = clientFields.extend({
  id: z.uuid(),
  version: z.number().int(),
  createdAt: z.string(),
  ordersCount: z.number().int(),
});
export const clientResponse = z.object({ data: clientView });
export const clientsResponse = z.object({
  data: z.array(clientView),
  pagination: commercePagination,
  summary: z.object({ total: z.number(), active: z.number(), vip: z.number() }),
});
