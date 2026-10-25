import { z } from "zod";
import { meetsPasswordRequirements } from "./password-policy";

export type AuthValidation = {
  email: string;
  password: string;
  registerPassword: string;
  name: string;
  businessName: string;
  confirm: string;
};

export function passwordSchema(min: number, message: string) {
  return z
    .string()
    .min(min, message)
    .max(72, message)
    .refine((value) => new TextEncoder().encode(value).byteLength <= 72, message);
}

export function newPasswordSchema(message: string) {
  return passwordSchema(1, message).refine(meetsPasswordRequirements, message);
}

export function createAuthSchemas(messages: AuthValidation) {
  const login = z.object({
    email: z.string().trim().toLowerCase().max(254, messages.email).pipe(z.email(messages.email)),
    password: passwordSchema(1, messages.password),
  });
  const register = login
    .extend({
      name: z.string().trim().min(1, messages.name).max(100, messages.name),
      password: newPasswordSchema(messages.registerPassword),
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
