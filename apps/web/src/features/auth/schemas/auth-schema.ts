import { z } from "zod";

export type AuthValidation = {
  email: string;
  password: string;
  registerPassword: string;
  name: string;
  businessName: string;
  confirm: string;
};

function password(min: number, message: string) {
  return z
    .string()
    .min(min, message)
    .max(72, message)
    .refine((value) => new TextEncoder().encode(value).byteLength <= 72, message);
}

export function createAuthSchemas(messages: AuthValidation) {
  const login = z.object({
    email: z.string().trim().toLowerCase().max(254, messages.email).pipe(z.email(messages.email)),
    password: password(1, messages.password),
  });
  const register = login
    .extend({
      name: z.string().trim().min(1, messages.name).max(100, messages.name),
      businessName: z.string().trim().min(1, messages.businessName).max(120, messages.businessName),
      password: password(12, messages.registerPassword),
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
