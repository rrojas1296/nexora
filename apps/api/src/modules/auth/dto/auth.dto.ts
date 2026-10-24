import { Buffer } from "node:buffer";
import { z } from "zod";
import { AuthError } from "../models/auth.js";

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const password = (min: number) =>
  z
    .string()
    .min(min)
    .max(72)
    .refine((value) => Buffer.byteLength(value, "utf8") <= 72);

const newPassword = password(1).refine(
  (value) => [...value].length >= 8 && /\p{L}/u.test(value) && /\p{Nd}/u.test(value),
);

export const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email,
    password: newPassword,
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

export const changePasswordSchema = z
  .object({
    currentPassword: password(1),
    newPassword,
  })
  .strict()
  .refine((value) => value.currentPassword !== value.newPassword);

export const credentialsChangePasswordSchema = changePasswordSchema.safeExtend({ email });

export function parseDto<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) throw new AuthError("invalid");
  return result.data;
}
