import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

export const whatsappIdSchema = z.uuid();
export const whatsappConnectionSchema = z.strictObject({
  phoneNumberId: z.string().regex(/^[1-9]\d{4,29}$/),
  accessToken: z
    .string()
    .trim()
    .min(20)
    .max(4096)
    .regex(/^[!-~]+$/),
});

export const whatsappSignupConfigurationSchema = z.object({
  appId: z.string(),
  configId: z.string(),
  graphVersion: z.string(),
  state: z.string(),
});

export const whatsappSignupSchema = z.strictObject({
  state: z.string().min(20).max(2048),
  code: z.string().min(1).max(4096),
  wabaId: z.string().regex(/^[1-9]\d{4,29}$/),
  phoneNumberId: z.string().regex(/^[1-9]\d{4,29}$/),
  pin: z.string().regex(/^\d{6}$/),
});

const recipient = z.string().regex(/^[1-9]\d{7,14}$/);
export const whatsappMessageSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("text"),
    to: recipient,
    text: z.strictObject({
      body: z
        .string()
        .min(1)
        .max(4096)
        .refine((value) => value.trim().length > 0),
      previewUrl: z.boolean().default(false),
    }),
  }),
  z.strictObject({
    type: z.literal("template"),
    to: recipient,
    template: z.strictObject({
      name: z.string().regex(/^[a-z0-9_]{1,512}$/),
      language: z.string().regex(/^[a-z]{2,3}(?:_[A-Z]{2})?$/),
      bodyParameters: z.array(z.string().min(1).max(1024)).max(20).default([]),
    }),
  }),
]);

export function parseWhatsappRequest<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new BadRequestException("Invalid WhatsApp request.");
  return parsed.data;
}
