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
  controlMode: "AI" | "HUMAN";
}
export interface WhatsappInboxMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  source: string;
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
  reason: "allowed" | "forbidden" | "notConnected" | "windowClosed" | "aiActive";
  windowExpiresAt: string | null;
}
export type WhatsappMessagePage = InboxPage<WhatsappInboxMessage> & {
  reply: WhatsappReplyAvailability;
  automation: {
    mode: "AI" | "HUMAN";
    version: number;
    configured: boolean;
    ready: boolean;
    canManage: boolean;
    inFlight: boolean;
    lastJob: { status: string; reason: string | null } | null;
  };
};
