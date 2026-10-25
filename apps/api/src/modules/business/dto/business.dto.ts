import { z } from "zod";

export const businessIdSchema = z.uuid();
const name = z.string().trim().min(1).max(120);
const description = z.string().trim().max(1000);
const currency = z.enum(["USD", "PEN", "MXN", "COP", "EUR"]);
const timezone = z
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
  });
const contextDraft = z.string().trim().max(30000);

export const createBusinessSchema = z
  .object({
    id: businessIdSchema,
    name,
    description: description.default(""),
    currency: currency.default("PEN"),
    timezone: timezone.default("UTC"),
    contextDraft: contextDraft.default(""),
    agentName: z.string().trim().min(1).max(100),
    agentTone: z.enum(["friendly", "professional", "concise"]).default("friendly"),
  })
  .strict();

export const updateBusinessSchema = z
  .object({
    name,
    description: description.optional(),
    currency: currency.optional(),
    timezone: timezone.optional(),
    contextDraft: contextDraft.optional(),
    publish: z.boolean().optional(),
    revision: z.number().int().min(0).optional(),
  })
  .strict()
  .refine(
    (input) => (input.contextDraft === undefined && !input.publish) || input.revision !== undefined,
  );
