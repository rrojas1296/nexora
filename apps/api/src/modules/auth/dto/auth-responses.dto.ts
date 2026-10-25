import { z } from "zod";
import { envelope } from "../../../common/documentation/response-schemas.js";

const id = z.uuid();
export const identityResponse = envelope(
  z.object({
    user: z.object({ id, name: z.string(), email: z.email() }),
    activeBusinessId: id.nullable(),
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
