import type { IncomingWhatsappMessage } from "../models/whatsapp-inbox.js";
import type { WhatsappInboxRepository } from "../repositories/whatsapp-inbox.repository.js";
import { WhatsappError, type WhatsappActor } from "../models/whatsapp.js";
import type { WhatsappService } from "./whatsapp.service.js";

export class WhatsappInboxService {
  constructor(
    private readonly repository: WhatsappInboxRepository,
    private readonly sender: WhatsappService,
  ) {}

  receive(messages: IncomingWhatsappMessage[]) {
    return this.repository.receive(messages);
  }

  setControl(
    actor: WhatsappActor,
    businessId: string,
    threadId: string,
    mode: "AI" | "HUMAN",
    version: number,
  ) {
    this.assertBusiness(actor, businessId);
    return this.repository.setControl(actor, threadId, mode, version);
  }

  threads(actor: WhatsappActor, businessId: string, cursor?: string) {
    this.assertBusiness(actor, businessId);
    return this.repository.threads(actor, cursor);
  }

  messages(actor: WhatsappActor, businessId: string, threadId: string, cursor?: string) {
    this.assertBusiness(actor, businessId);
    return this.repository.messages(actor, threadId, cursor);
  }

  async sendText(
    actor: WhatsappActor,
    businessId: string,
    threadId: string,
    key: string,
    body: string,
  ) {
    this.assertBusiness(actor, businessId);
    const recipient = await this.repository.recipient(actor, threadId);
    return this.sender.send(
      actor,
      businessId,
      key,
      { type: "text", to: recipient.contactWaId, text: { body, previewUrl: false } },
      { threadId, ...recipient, body },
    );
  }

  attempt(actor: WhatsappActor, businessId: string, threadId: string, key: string) {
    this.assertBusiness(actor, businessId);
    return this.sender.getConversationAttempt(actor, businessId, threadId, key);
  }

  private assertBusiness(actor: WhatsappActor, businessId: string) {
    if (actor.businessId !== businessId) throw new WhatsappError("WHATSAPP_FORBIDDEN");
  }
}
