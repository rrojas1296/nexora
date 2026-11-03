import { Inject, Injectable } from "@nestjs/common";
import {
  WHATSAPP_COMMERCE_REPOSITORY,
  type ProofReview,
  type IWhatsappCommerceRepository,
} from "../contracts/whatsapp-commerce.js";
import { WhatsappError, type WhatsappActor } from "../models/whatsapp.js";

@Injectable()
export class WhatsappCommerceService {
  constructor(
    @Inject(WHATSAPP_COMMERCE_REPOSITORY) private readonly repository: IWhatsappCommerceRepository,
  ) {}

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
