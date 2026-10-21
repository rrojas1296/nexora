import { z } from "zod";
import { newPasswordSchema, passwordSchema } from "./auth-schema";

type ChangePasswordValidation = {
  email: string;
  current: string;
  password: string;
  confirm: string;
  different: string;
};

export function createChangePasswordSchema(
  messages: ChangePasswordValidation,
  withCredentials = false,
) {
  return z
    .object({
      email: withCredentials
        ? z.string().trim().toLowerCase().max(254, messages.email).pipe(z.email(messages.email))
        : z.string(),
      currentPassword: passwordSchema(1, messages.current),
      newPassword: newPasswordSchema(messages.password),
      confirmPassword: z.string(),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
      path: ["confirmPassword"],
      message: messages.confirm,
    })
    .refine((value) => value.currentPassword !== value.newPassword, {
      path: ["newPassword"],
      message: messages.different,
    });
}

export type ChangePasswordValues = z.infer<ReturnType<typeof createChangePasswordSchema>>;
