import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

const name = z.string().trim().min(2).max(100);
const shortText = z.string().trim().max(100);
const money = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/)
  .refine((value) => Number(value) <= 999999);
const inventory = z.number().int().min(0).max(1000000);
export const categoryInputSchema = z.strictObject({ name });
export const productIdSchema = z.uuid();
export const productInputSchema = z.strictObject({
  name,
  sku: z.string().trim().min(2).max(30),
  description: z.string().trim().max(2000),
  category: name,
  imageUrl: z.union([
    z.literal(""),
    z.url({ protocol: /^https?$/ }).max(2048),
    z.templateLiteral(["/api/v1/businesses/", z.uuid(), "/products/images/", z.uuid()]),
  ]),
  brand: shortText,
  supplier: shortText,
  barcode: z.string().trim().max(50),
  price: money,
  cost: money,
  compareAtPrice: money,
  stock: inventory,
  lowStockThreshold: inventory,
  weight: inventory,
  active: z.boolean(),
});
export const productPatchSchema = productInputSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0);
export const productListSchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).default(""),
  status: z.enum(["all", "active", "inactive"]).default("all"),
});

export function parseProductRequest<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new BadRequestException();
  return result.data;
}
