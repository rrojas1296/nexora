import { z } from "zod";
import { envelope } from "../../../common/documentation/response-schemas.js";

export const businessResponse = envelope(
  z.object({
    id: z.uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
    currency: z.string(),
    timezone: z.string(),
    contextDraft: z.string(),
    contextPublished: z.string(),
    contextVersion: z.number().int(),
    revision: z.number().int(),
    contextPublishedAt: z.iso.datetime().nullable(),
  }),
);
