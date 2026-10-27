import { z } from "zod";

export const inboxControlSchema = z.strictObject({
  mode: z.enum(["AI", "HUMAN"]),
  version: z.number().int().nonnegative(),
});
export const inboxControlResponseSchema = z.object({
  mode: z.enum(["AI", "HUMAN"]),
  version: z.number().int().nonnegative(),
});
export const automationSchema = z.object({
  mode: z.enum(["AI", "HUMAN"]),
  version: z.number().int(),
  configured: z.boolean(),
  ready: z.boolean(),
  canManage: z.boolean(),
  inFlight: z.boolean(),
  lastJob: z
    .object({
      status: z.enum([
        "QUEUED",
        "GENERATING",
        "SENDING",
        "ACCEPTED",
        "FAILED",
        "UNKNOWN",
        "CANCELLED",
        "SKIPPED",
      ]),
      reason: z.string().nullable(),
    })
    .nullable(),
});
export const inboxSendTextSchema = z.strictObject({ body: z.string().trim().min(1).max(4096) });
export const inboxReplySchema = z.object({
  allowed: z.boolean(),
  reason: z.enum(["allowed", "forbidden", "notConnected", "windowClosed", "aiActive"]),
  windowExpiresAt: z.iso.datetime().nullable(),
});
export const inboxQuerySchema = z.strictObject({ cursor: z.uuid().optional() });
export const inboxThreadsQuerySchema = inboxQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
});
export const threadSchema = z.object({
  id: z.uuid(),
  phoneNumberId: z.string(),
  contactWaId: z.string(),
  contactName: z.string(),
  lastMessageAt: z.iso.datetime(),
  lastMessageBody: z.string(),
  lastMessageType: z.string(),
  controlMode: z.enum(["AI", "HUMAN"]),
});
export const inboxMessageSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  source: z.string(),
  sendStatus: z.enum(["PENDING", "ACCEPTED", "REJECTED", "UNKNOWN"]).nullable(),
  type: z.string(),
  body: z.string(),
  sentAt: z.iso.datetime(),
  receivedAt: z.iso.datetime(),
  mediaStatus: z.string(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      name: z.string().nullable(),
      address: z.string().nullable(),
    })
    .nullable(),
});
export const threadPageSchema = z.object({
  items: z.array(threadSchema),
  nextCursor: z.uuid().nullable(),
});
export const messagePageSchema = z.object({
  items: z.array(inboxMessageSchema),
  reply: inboxReplySchema,
  automation: automationSchema,
  nextCursor: z.uuid().nullable(),
});
