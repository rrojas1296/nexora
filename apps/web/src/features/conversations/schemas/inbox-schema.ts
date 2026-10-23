import { z } from "zod";

const threadSchema = z.object({
  id: z.uuid(),
  phoneNumberId: z.string(),
  contactWaId: z.string(),
  contactName: z.string(),
  lastMessageAt: z.iso.datetime(),
  lastMessageBody: z.string(),
  lastMessageType: z.string(),
});
const sendStatusSchema = z.enum(["PENDING", "ACCEPTED", "REJECTED", "UNKNOWN"]);
export const replySchema = z.object({
  allowed: z.boolean(),
  reason: z.enum(["allowed", "forbidden", "notConnected", "windowClosed"]),
  windowExpiresAt: z.iso.datetime().nullable(),
});
export const sendTextSchema = z.object({ body: z.string().trim().min(1).max(4096) });
export const sendAttemptResponseSchema = z.object({
  data: z.object({
    id: z.uuid(),
    status: sendStatusSchema,
    providerMessageId: z.string().nullable(),
    providerErrorCode: z.number().int().nullable(),
    providerHttpStatus: z.number().int().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  }),
});
const messageSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  sendStatus: sendStatusSchema.nullable(),
  type: z.string(),
  body: z.string(),
  sentAt: z.iso.datetime(),
  receivedAt: z.iso.datetime(),
});
export const threadResponseSchema = z.object({
  data: z.object({ items: z.array(threadSchema), nextCursor: z.uuid().nullable() }),
});
export const messageResponseSchema = z.object({
  data: z.object({
    items: z.array(messageSchema),
    nextCursor: z.uuid().nullable(),
    reply: replySchema,
  }),
});
export type InboxReply = z.infer<typeof replySchema>;
export type InboxSendAttempt = z.infer<typeof sendAttemptResponseSchema>["data"];
export type InboxTextValues = z.input<typeof sendTextSchema>;
export type InboxThread = z.infer<typeof threadSchema>;
export type InboxScope = { userId: string; businessId: string };
