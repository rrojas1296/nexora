import { Buffer } from "node:buffer";
import { z } from "zod";
import { AuthError } from "../domain/auth.js";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const password = (min: number) =>
  z
    .string()
    .min(min)
    .max(72)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72);

export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email,
    password: password(12),
    businessName: z.string().trim().min(1).max(120),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: password(1),
    businessId: z.uuid().optional(),
  })
  .strict();

export function parseDto<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new AuthError("invalid");
  return result.data;
}
