import type { WhatsappActor } from "./whatsapp.js";

export interface IncomingWhatsappMessage {
  phoneNumberId: string;
  contactWaId: string;
  contactName: string;
  providerMessageId: string;
  type: string;
  body: string;
  sentAt: Date;
}
export interface WhatsappThreadSummary {
  id: string;
  phoneNumberId: string;
  contactWaId: string;
  contactName: string;
  lastMessageAt: string;
  lastMessageBody: string;
  lastMessageType: string;
}
export interface WhatsappInboxMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  sendStatus: "PENDING" | "ACCEPTED" | "REJECTED" | "UNKNOWN" | null;
  type: string;
  body: string;
  sentAt: string;
  receivedAt: string;
}
export interface InboxPage<T> {
  items: T[];
  nextCursor: string | null;
}
export interface WhatsappReplyAvailability {
  allowed: boolean;
  reason: "allowed" | "forbidden" | "notConnected" | "windowClosed";
  windowExpiresAt: string | null;
}
export type WhatsappMessagePage = InboxPage<WhatsappInboxMessage> & {
  reply: WhatsappReplyAvailability;
};
export interface WhatsappInboxRepository {
  recipient(
    actor: WhatsappActor,
    threadId: string,
  ): Promise<{ phoneNumberId: string; contactWaId: string }>;
  receive(messages: IncomingWhatsappMessage[]): Promise<void>;
  threads(actor: WhatsappActor, cursor?: string): Promise<InboxPage<WhatsappThreadSummary>>;
  messages(actor: WhatsappActor, threadId: string, cursor?: string): Promise<WhatsappMessagePage>;
}
