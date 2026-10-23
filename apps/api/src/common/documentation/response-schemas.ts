import { z } from "zod";
import { agentInputSchema } from "../../modules/agents/presentation/agents.dto.js";
import { productInputSchema } from "../../modules/products/presentation/products.dto.js";

const id = z.uuid();
const timestamp = z.iso.datetime();
const timestamps = { createdAt: timestamp, updatedAt: timestamp };
export const envelope = (data: z.ZodType) => z.object({ data });

export const identityResponse = envelope(
  z.object({
    user: z.object({ id, name: z.string(), email: z.email() }),
    activeBusinessId: id,
    memberships: z.array(
      z.object({
        businessId: id,
        role: z.string(),
        business: z.object({ id, name: z.string(), slug: z.string() }),
      }),
    ),
  }),
);
export const csrfResponse = envelope(z.object({ csrfToken: z.string() }));
export const businessResponse = envelope(z.object({ id, name: z.string(), slug: z.string() }));

// Stored decimals are serialized strings; output is not restricted to input precision formatting.
const product = productInputSchema.extend({
  id,
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
  }),
});
const agent = agentInputSchema.extend({ id, ...timestamps });
export const agentResponse = envelope(agent);
export const nullableAgentResponse = envelope(agent.nullable());

export const connectionResponse = z.object({
  id,
  phoneNumberId: z.string(),
  displayPhoneNumber: z.string(),
  verifiedName: z.string(),
  updatedAt: timestamp,
});
export const attemptResponse = envelope(
  z.object({
    id,
    status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "UNKNOWN"]),
    providerMessageId: z.string().nullable(),
    providerErrorCode: z.number().int().nullable(),
    providerHttpStatus: z.number().int().nullable(),
    ...timestamps,
  }),
);
