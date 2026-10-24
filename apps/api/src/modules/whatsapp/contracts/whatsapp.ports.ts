import type {
  WhatsappActor,
  WhatsappConversationSend,
  WhatsappConnection,
  WhatsappCredentials,
  WhatsappMessage,
  WhatsappPhone,
  WhatsappSendAttempt,
  WhatsappSignupConfiguration,
} from "../models/whatsapp.js";

export interface WhatsappRepository {
  authorize(actor: WhatsappActor): Promise<void>;
  assertSignupPhoneAvailable(actor: WhatsappActor, phoneNumberId: string): Promise<void>;
  getConnection(actor: WhatsappActor): Promise<WhatsappConnection | null>;
  saveConnection(
    actor: WhatsappActor,
    credentials: WhatsappCredentials,
    onlyDisconnected?: boolean,
  ): Promise<WhatsappConnection>;
  disconnect(actor: WhatsappActor): Promise<void>;
  reserveSend(
    actor: WhatsappActor,
    key: string,
    hash: string,
    conversation?: WhatsappConversationSend,
  ): Promise<{
    attempt: WhatsappSendAttempt;
    credentials: WhatsappCredentials | null;
  }>;
  finishSend(
    businessId: string,
    attemptId: string,
    result: WhatsappSendResult,
  ): Promise<WhatsappSendAttempt>;
  getAttempt(actor: WhatsappActor, attemptId: string): Promise<WhatsappSendAttempt>;
  getConversationAttempt(
    actor: WhatsappActor,
    threadId: string,
    key: string,
  ): Promise<WhatsappSendAttempt>;
}

export interface WhatsappSendResult {
  status: "ACCEPTED" | "REJECTED" | "UNKNOWN";
  providerMessageId: string | null;
  providerErrorCode?: number | null;
  providerHttpStatus?: number | null;
}

export interface WhatsappGateway {
  verifyPhone(phoneNumberId: string, accessToken: string): Promise<WhatsappPhone>;
  send(
    phoneNumberId: string,
    accessToken: string,
    message: WhatsappMessage,
  ): Promise<WhatsappSendResult>;
}

export interface WhatsappSignupGateway {
  exchangeCode(code: string): Promise<string>;
  verifyAssets(wabaId: string, phoneNumberId: string, accessToken: string): Promise<void>;
  subscribe(wabaId: string, accessToken: string): Promise<void>;
  register(phoneNumberId: string, accessToken: string, pin: string): Promise<void>;
}

export interface WhatsappSignupState {
  configuration(actor: WhatsappActor): Promise<WhatsappSignupConfiguration>;
  verify(actor: WhatsappActor, state: string): Promise<void>;
}

export interface WhatsappTokenVault {
  encrypt(token: string, businessId: string, phoneNumberId: string): string;
  decrypt(token: string, businessId: string, phoneNumberId: string): string;
}

export interface WhatsappMessageHasher {
  hash(message: WhatsappMessage): string;
}
