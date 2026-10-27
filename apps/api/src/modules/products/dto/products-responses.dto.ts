import { productInputSchema } from "./products.dto.js";
import { z } from "zod";
import { envelope } from "../../../common/documentation/response-schemas.js";

const id = z.uuid();
const timestamp = z.iso.datetime();
const timestamps = { createdAt: timestamp, updatedAt: timestamp };

// Stored decimals are serialized strings; output is not restricted to input precision formatting.
const product = productInputSchema.extend({
  id,
  sku: z.string().nullable(),
  brand: z.string(),
  supplier: z.string(),
  barcode: z.string(),
  currency: z.string(),
  ...timestamps,
  price: z.string(),
  cost: z.string(),
  compareAtPrice: z.string(),
});
export const productResponse = envelope(product);
const category = z.object({ id, name: z.string() });
export const categoryResponse = envelope(category);
export const categoriesResponse = envelope(z.array(category));
export const imageResponse = envelope(z.object({ imageUrl: z.string() }));
export const productListResponse = z.object({
  data: z.array(product),
  pagination: z.object({
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
    pages: z.number().int(),
  }),
  summary: z.object({
    catalog: z.number().int(),
    available: z.number().int(),
    lowStock: z.number().int(),
    inventoryValue: z.string(),
    currency: z.string(),
  }),
});
