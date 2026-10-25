import type { WhatsappActor } from "../models/whatsapp.js";
import type {
  IncomingWhatsappMessage,
  InboxPage,
  WhatsappThreadSummary,
  WhatsappMessagePage,
} from "../models/whatsapp-inbox.js";

export interface WhatsappInboxRepository {
  setControl(
    actor: WhatsappActor,
    threadId: string,
    mode: "AI" | "HUMAN",
    version: number,
  ): Promise<{ mode: "AI" | "HUMAN"; version: number }>;
  recipient(
    actor: WhatsappActor,
    threadId: string,
  ): Promise<{ phoneNumberId: string; contactWaId: string }>;
  receive(messages: IncomingWhatsappMessage[]): Promise<void>;
  threads(actor: WhatsappActor, cursor?: string): Promise<InboxPage<WhatsappThreadSummary>>;
  messages(actor: WhatsappActor, threadId: string, cursor?: string): Promise<WhatsappMessagePage>;
}
