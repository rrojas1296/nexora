import { z } from "zod";

export type AuthValidation = { email: string; password: string; name: string; confirm: string };

export function createAuthSchemas(messages: AuthValidation) {
  const login = z.object({
    email: z.string().trim().toLowerCase().max(254, messages.email).pipe(z.email(messages.email)),
    password: z.string().min(8, messages.password).max(128, messages.password),
  });
  const register = login
    .extend({
      name: z.string().trim().min(2, messages.name).max(80, messages.name),
      confirmPassword: z.string(),
    })
    .refine((value) => value.password === value.confirmPassword, {
      path: ["confirmPassword"],
      message: messages.confirm,
    });
  return { login, register };
}

export type LoginValues = z.infer<ReturnType<typeof createAuthSchemas>["login"]>;
export type RegisterValues = z.infer<ReturnType<typeof createAuthSchemas>["register"]>;
