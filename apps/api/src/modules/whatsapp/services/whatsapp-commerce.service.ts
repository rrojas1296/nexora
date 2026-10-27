import type { ProofReview, WhatsappCommerceRepository } from "../contracts/whatsapp-commerce.js";
import { WhatsappError, type WhatsappActor } from "../models/whatsapp.js";

export class WhatsappCommerceService {
  constructor(private readonly repository: WhatsappCommerceRepository) {}

  private assertBusiness(actor: WhatsappActor, businessId: string) {
    if (actor.businessId !== businessId) throw new WhatsappError("WHATSAPP_FORBIDDEN");
  }

  orders(actor: WhatsappActor, businessId: string, threadId: string, cursor?: string) {
    this.assertBusiness(actor, businessId);
    return this.repository.orders(actor, threadId, cursor);
  }

  media(actor: WhatsappActor, businessId: string, threadId: string, messageId: string) {
    this.assertBusiness(actor, businessId);
    return this.repository.media(actor, threadId, messageId);
  }

  review(
    actor: WhatsappActor,
    businessId: string,
    threadId: string,
    orderId: string,
    proofId: string,
    input: ProofReview,
  ) {
    this.assertBusiness(actor, businessId);
    return this.repository.review(actor, threadId, orderId, proofId, input);
  }
}
