import type { WhatsappActor } from "./whatsapp.js";

export interface WhatsappAuthorizedAsset {
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
}

export interface WhatsappAuthorizationAttempt {
  id: string;
  locale: "es" | "en";
  status: string;
  expiresAt: Date;
  encryptedAccessToken: string | null;
  assets: WhatsappAuthorizedAsset[];
}

export interface WhatsappAuthorizationStore {
  create(
    actor: WhatsappActor,
    stateHash: string,
    locale: "es" | "en",
  ): Promise<WhatsappAuthorizationAttempt>;
  claimCallback(actor: WhatsappActor, stateHash: string): Promise<WhatsappAuthorizationAttempt>;
  get(actor: WhatsappActor, id: string): Promise<WhatsappAuthorizationAttempt>;
  ready(
    actor: WhatsappActor,
    id: string,
    encryptedAccessToken: string,
    assets: WhatsappAuthorizedAsset[],
  ): Promise<void>;
  claimCompletion(actor: WhatsappActor, id: string): Promise<WhatsappAuthorizationAttempt>;
  finish(
    actor: WhatsappActor,
    id: string,
    status: "CONNECTED" | "FAILED" | "CANCELLED",
  ): Promise<void>;
}

export interface WhatsappAuthorizationProvider {
  authorizationUrl(state: string): string;
  returnUrl(locale: "es" | "en", attemptId?: string): string;
  exchangeCode(code: string): Promise<string>;
  assets(token: string): Promise<WhatsappAuthorizedAsset[]>;
}
