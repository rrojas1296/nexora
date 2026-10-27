import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import type { IncomingWhatsappMessage } from "../models/whatsapp-inbox.js";

export const notificationSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(
    z.object({
      id: z.string().min(1),
      changes: z.array(
        z.object({ field: z.string().min(1), value: z.record(z.string(), z.unknown()) }),
      ),
    }),
  ),
});
const mediaSchema = z.object({
  id: z.string().regex(/^\d{1,128}$/),
  mime_type: z.string().max(128).optional(),
  caption: z.string().max(65_536).optional(),
});
const locationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  name: z.string().max(512).optional(),
  address: z.string().max(2048).optional(),
});
const waId = z.string().regex(/^\d{5,20}$/);
const valueSchema = z.object({
  metadata: z.object({ phone_number_id: z.string().regex(/^\d{1,32}$/) }),
  contacts: z
    .array(z.object({ wa_id: waId, profile: z.object({ name: z.string().max(1024) }).optional() }))
    .max(1000)
    .optional(),
  messages: z
    .array(
      z.object({
        id: z.string().min(1).max(512),
        from: waId,
        timestamp: z.string().regex(/^\d{1,10}$/),
        type: z.string().min(1).max(100),
        text: z.object({ body: z.string().max(65_536) }).optional(),
        image: mediaSchema.optional(),
        location: locationSchema.optional(),
        video: z.object({ caption: z.string().max(65_536).optional() }).optional(),
        document: mediaSchema.optional(),
      }),
    )
    .max(100),
});

export function decodeWhatsappNotification(body: unknown): IncomingWhatsappMessage[] {
  const notification = notificationSchema.safeParse(body);
  if (!notification.success)
    throw new BadRequestException("Invalid WhatsApp webhook notification.");
  const messages: IncomingWhatsappMessage[] = [];
  for (const entry of notification.data.entry) {
    for (const change of entry.changes) {
      if (change.field !== "messages" || change.value.messages === undefined) continue;
      const result = valueSchema.safeParse(change.value);
      if (!result.success) throw new BadRequestException("Invalid WhatsApp messages notification.");
      const value = result.data;
      const names = new Map(
        value.contacts?.map((contact) => [contact.wa_id, contact.profile?.name]),
      );
      for (const message of value.messages) {
        messages.push({
          phoneNumberId: value.metadata.phone_number_id,
          contactWaId: message.from,
          contactName: names.get(message.from) || message.from,
          providerMessageId: message.id,
          type: message.type,
          mediaId:
            message.type === "image"
              ? message.image?.id
              : message.type === "document"
                ? message.document?.id
                : undefined,
          mediaMimeType:
            message.type === "image"
              ? message.image?.mime_type
              : message.type === "document"
                ? message.document?.mime_type
                : undefined,
          location: message.type === "location" ? message.location : undefined,
          sentAt: new Date(Number(message.timestamp) * 1000),
          body:
            message.type === "text"
              ? (message.text?.body ?? "")
              : message.type === "image"
                ? (message.image?.caption ?? "")
                : message.type === "video"
                  ? (message.video?.caption ?? "")
                  : message.type === "document"
                    ? (message.document?.caption ?? "")
                    : "",
        });
        if (messages.length > 100)
          throw new BadRequestException("Too many WhatsApp messages in one notification.");
      }
    }
  }
  return messages;
}
