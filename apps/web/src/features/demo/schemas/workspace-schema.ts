import { z } from "zod";
import { currencies, defaultCurrency } from "@/lib/config/currency";
import { productInputSchema } from "@/features/products/schemas/product-schema";

export { productInputSchema } from "@/features/products/schemas/product-schema";

export { currencies } from "@/lib/config/currency";

const id = z.string().min(1);
const name = z.string().trim().min(2, "name").max(100, "name");
const text = z.string().trim().max(2000, "text");
const shortText = z.string().trim().max(100, "text");
const money = z
  .number({ error: "price" })
  .min(0, "price")
  .max(999999, "price")
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, "price");
export const clientSegments = ["retail", "wholesale", "vip"] as const;
export const clientCountries = ["US", "MX", "CO", "ES", "AR", "CL", "PE"] as const;
export const orderStatuses = ["pending", "paid", "shipped", "cancelled"] as const;
export const conversationStatuses = ["open", "pending", "closed"] as const;
export const tones = ["friendly", "professional", "concise"] as const;

export const productSchema = productInputSchema.extend({ id });
export const clientInputSchema = z.object({
  name,
  email: z.string().trim().toLowerCase().max(254, "email").pipe(z.email("email")),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "phone"),
  notes: text,
  company: shortText,
  taxId: z.string().trim().max(50, "text"),
  segment: z.enum(clientSegments, { error: "required" }),
  active: z.boolean(),
  address: z.string().trim().max(200, "text"),
  city: shortText,
  region: shortText,
  postalCode: z.string().trim().max(20, "text"),
  country: z.enum(clientCountries, { error: "required" }),
  language: z.enum(["es", "en"], { error: "required" }),
  marketingConsent: z.boolean(),
});
export const clientSchema = clientInputSchema.extend({ id });
export const storeInputSchema = z.object({
  name,
  address: z.string().trim().min(5, "address").max(200, "address"),
  currency: z.enum(currencies, { error: "required" }),
  timezone: z.enum(["America/Mexico_City", "America/Bogota", "America/New_York", "Europe/Madrid"], {
    error: "required",
  }),
  active: z.boolean(),
});
export const storeSchema = storeInputSchema.extend({ id });
export const orderItemInputSchema = z.object({
  productId: id,
  name,
  quantity: z.number({ error: "stock" }).int("stock").min(1, "stock").max(1000000, "stock"),
  unitPrice: money,
});
export const orderInputSchema = z.object({
  clientId: id,
  storeId: id,
  status: z.enum(orderStatuses),
  createdAt: z.iso.datetime(),
  currency: z.literal(defaultCurrency),
  items: z.array(orderItemInputSchema).min(1, "required").max(100, "text"),
});
export const orderSchema = orderInputSchema.extend({ id });
export const messageInputSchema = z.object({
  body: z.string().trim().min(1, "message").max(2000, "message"),
});
export const conversationSchema = z.object({
  id,
  clientId: id,
  status: z.enum(conversationStatuses),
  assignedTo: z.enum(["agent", "human"]),
  messages: z.array(
    messageInputSchema.extend({
      id,
      author: z.enum(["customer", "team"]),
      createdAt: z.iso.datetime(),
    }),
  ),
});
export const agentSchema = z.object({
  name,
  tone: z.enum(tones, { error: "required" }),
  instructions: z.string().trim().min(20, "instructions").max(2000, "instructions"),
  greeting: z.string().trim().min(5, "greeting").max(300, "greeting"),
  enabled: z.boolean(),
});
export const settingsSchema = z.object({
  businessName: name,
  email: z.string().trim().toLowerCase().max(254, "email").pipe(z.email("email")),
  notifications: z.boolean(),
  weekStart: z.enum(["monday", "sunday"], { error: "required" }),
});
export const workspaceSchema = z.object({
  products: z.array(productSchema),
  clients: z.array(clientSchema),
  stores: z.array(storeSchema),
  orders: z.array(orderSchema),
  conversations: z.array(conversationSchema),
  agent: agentSchema,
  settings: settingsSchema,
});
