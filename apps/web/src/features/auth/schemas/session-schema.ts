import { z } from "zod";

export const sessionSchema = z.object({
  user: z.object({ id: z.uuid(), name: z.string(), email: z.email() }),
  activeBusinessId: z.uuid().nullable(),
  memberships: z.array(
    z.object({
      businessId: z.uuid(),
      role: z.string(),
      business: z.object({ id: z.uuid(), name: z.string(), slug: z.string() }),
    }),
  ),
});

export type Session = z.infer<typeof sessionSchema>;
export const sessionResponseSchema = z.object({ data: sessionSchema });
