export type WhatsappErrorCode =
  | "WHATSAPP_FORBIDDEN"
  | "WHATSAPP_AI_ACTIVE"
  | "WHATSAPP_CONTROL_CONFLICT"
  | "WHATSAPP_NOT_CONNECTED"
  | "WHATSAPP_REPLY_WINDOW_CLOSED"
  | "WHATSAPP_CONNECTION_CONFLICT"
  | "WHATSAPP_IDEMPOTENCY_CONFLICT"
  | "WHATSAPP_ATTEMPT_NOT_FOUND"
  | "WHATSAPP_CONVERSATION_NOT_FOUND"
  | "WHATSAPP_NOT_CONFIGURED"
  | "WHATSAPP_PROVIDER_UNAVAILABLE"
  | "WHATSAPP_INVALID_CREDENTIALS"
  | "WHATSAPP_SIGNUP_EXPIRED"
  | "WHATSAPP_SIGNUP_INCOMPLETE";

export class WhatsappError extends Error {
  constructor(readonly code: WhatsappErrorCode) {
    super(code);
  }
}

export interface WhatsappActor {
  userId: string;
  businessId: string;
  sessionId: string;
}

export interface WhatsappSignupInput {
  state: string;
  code: string;
  wabaId: string;
  phoneNumberId: string;
  pin: string;
}

export interface WhatsappSignupConfiguration {
  appId: string;
  configId: string;
  graphVersion: string;
  state: string;
}

export interface WhatsappConnectionInput {
  phoneNumberId: string;
  accessToken: string;
}

export interface WhatsappPhone {
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
}

export interface WhatsappConnection extends WhatsappPhone {
  id: string;
  updatedAt: string;
}

export interface WhatsappCredentials extends WhatsappPhone {
  encryptedAccessToken: string;
}

export type WhatsappMessage =
  | { type: "text"; to: string; text: { body: string; previewUrl: boolean } }
  | {
      type: "template";
      to: string;
      template: { name: string; language: string; bodyParameters: string[] };
    };

export interface WhatsappConversationSend {
  threadId: string;
  phoneNumberId: string;
  contactWaId: string;
  body: string;
}

export type WhatsappSendStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "UNKNOWN";

export interface WhatsappSendAttempt {
  id: string;
  status: WhatsappSendStatus;
  providerMessageId: string | null;
  providerErrorCode: number | null;
  providerHttpStatus: number | null;
  createdAt: string;
  updatedAt: string;
}
