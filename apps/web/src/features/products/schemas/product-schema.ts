import { z } from "zod";

const name = z.string().trim().min(2, "name").max(100, "name");
const shortText = z.string().trim().max(100, "text");
const money = z
  .number({ error: "price" })
  .min(0, "price")
  .max(999999, "price")
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, "price");
const inventory = z.number({ error: "stock" }).int("stock").min(0, "stock").max(1000000, "stock");

export const productInputSchema = z.object({
  name,
  sku: z.string().trim().min(2, "sku").max(30, "sku"),
  description: z.string().trim().max(2000, "text"),
  category: name,
  brand: shortText,
  supplier: shortText,
  barcode: z.string().trim().max(50, "text"),
  price: money,
  cost: money,
  compareAtPrice: money,
  weight: inventory,
  stock: inventory,
  lowStockThreshold: inventory,
  active: z.boolean(),
});
const decimal = z
  .string()
  .regex(/^\d+(?:\.\d{1,2})?$/)
  .transform(Number);
export const productSchema = productInputSchema.extend({
  id: z.uuid(),
  price: decimal,
  cost: decimal,
  compareAtPrice: decimal,
  currency: z.string().length(3),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const productResponseSchema = z.object({ data: productSchema });
export const productSummarySchema = z.object({
  catalog: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  lowStock: z.number().int().nonnegative(),
  inventoryValue: decimal,
});
export const productListSchema = z.object({
  data: z.array(productSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    pages: z.number().int().positive(),
  }),
  summary: productSummarySchema,
});
export type ProductInput = z.infer<typeof productInputSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductSummary = z.infer<typeof productSummarySchema>;
export type ProductListFilters = {
  search: string;
  status: "all" | "active" | "inactive";
  page: number;
  pageSize: number;
};
export type ProductScope = { userId: string; businessId: string };
