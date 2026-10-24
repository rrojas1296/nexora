import { z } from "zod";

export const inboxSendTextSchema = z.strictObject({ body: z.string().trim().min(1).max(4096) });
export const inboxReplySchema = z.object({
  allowed: z.boolean(),
  reason: z.enum(["allowed", "forbidden", "notConnected", "windowClosed"]),
  windowExpiresAt: z.iso.datetime().nullable(),
});
export const inboxQuerySchema = z.strictObject({ cursor: z.uuid().optional() });
export const threadSchema = z.object({
  id: z.uuid(),
  phoneNumberId: z.string(),
  contactWaId: z.string(),
  contactName: z.string(),
  lastMessageAt: z.iso.datetime(),
  lastMessageBody: z.string(),
  lastMessageType: z.string(),
});
export const inboxMessageSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  sendStatus: z.enum(["PENDING", "ACCEPTED", "REJECTED", "UNKNOWN"]).nullable(),
  type: z.string(),
  body: z.string(),
  sentAt: z.iso.datetime(),
  receivedAt: z.iso.datetime(),
});
export const threadPageSchema = z.object({
  items: z.array(threadSchema),
  nextCursor: z.uuid().nullable(),
});
export const messagePageSchema = z.object({
  items: z.array(inboxMessageSchema),
  reply: inboxReplySchema,
  nextCursor: z.uuid().nullable(),
});
