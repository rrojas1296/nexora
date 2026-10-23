import { z } from "zod";

export const authorizationStartSchema = z.strictObject({ locale: z.enum(["es", "en"]) });
export const authorizationUrlSchema = z.object({ authorizationUrl: z.url() });
export const authorizationCallbackSchema = z.object({
  state: z.string().regex(/^[a-f0-9]{64}$/),
  code: z.string().min(1).max(4096).optional(),
  error: z.string().max(256).optional(),
});
export const authorizationCompleteSchema = z.strictObject({
  attemptId: z.uuid(),
  wabaId: z.string().regex(/^[1-9]\d{4,29}$/),
  phoneNumberId: z.string().regex(/^[1-9]\d{4,29}$/),
});
export const authorizationStatusSchema = z.object({
  id: z.uuid(),
  status: z.string(),
  expiresAt: z.iso.datetime(),
  assets: z.array(
    z.object({
      wabaId: z.string(),
      phoneNumberId: z.string(),
      displayPhoneNumber: z.string(),
      verifiedName: z.string(),
    }),
  ),
});
