import type { WhatsappActor } from "../models/whatsapp.js";
import type {
  WhatsappAuthorizationAttempt,
  WhatsappAuthorizedAsset,
} from "../models/whatsapp-authorization.js";

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
