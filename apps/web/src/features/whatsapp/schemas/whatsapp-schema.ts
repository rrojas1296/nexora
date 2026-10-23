import { z } from "zod";

export interface WhatsappScope {
  userId: string;
  businessId: string;
}

export const connectionSchema = z.object({
  id: z.uuid(),
  phoneNumberId: z.string(),
  displayPhoneNumber: z.string(),
  verifiedName: z.string(),
  updatedAt: z.string(),
});
export const connectionResponseSchema = z.object({ data: connectionSchema.nullable() });
export const authorizationUrlSchema = z.object({
  data: z.object({
    authorizationUrl: z.url().refine((value) => {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.hostname === "www.facebook.com" &&
        /^\/v[1-9]\d{0,2}\.0\/dialog\/oauth$/.test(url.pathname)
      );
    }),
  }),
});
export const authorizationAttemptSchema = z.object({
  data: z.object({
    id: z.uuid(),
    status: z.string(),
    expiresAt: z.string(),
    assets: z.array(
      z.object({
        wabaId: z.string(),
        phoneNumberId: z.string(),
        displayPhoneNumber: z.string(),
        verifiedName: z.string(),
      }),
    ),
  }),
});
export const authorizationSelectionSchema = z.object({ phoneNumberId: z.string().min(1) });
export type AuthorizationSelection = z.infer<typeof authorizationSelectionSchema>;
export type WhatsappConnection = z.infer<typeof connectionSchema>;
