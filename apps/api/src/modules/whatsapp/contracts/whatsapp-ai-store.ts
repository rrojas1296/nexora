import type { AiReplyInput } from "./ai-text-generator.js";
import type {
  WhatsappCredentials,
  WhatsappMessage,
  WhatsappSendAttempt,
} from "../models/whatsapp.js";

export interface AiReplyWork {
  id: string;
  businessId: string;
  threadId: string;
  threadVersion: number;
  contextVersion: number;
  agentUpdatedAt: Date;
  connectionUpdatedAt: Date;
  input: AiReplyInput;
}

export interface AiReplyReservation {
  message: WhatsappMessage;
  attempt: WhatsappSendAttempt;
  credentials: WhatsappCredentials;
}

export interface WhatsappAiStore {
  recoverExpired(): Promise<void>;
  claim(provider: string, model: string): Promise<AiReplyWork | null>;
  reserve(work: AiReplyWork, text: string): Promise<AiReplyReservation | null>;
  finish(id: string, status: "ACCEPTED" | "FAILED" | "UNKNOWN", reason?: string): Promise<void>;
}
