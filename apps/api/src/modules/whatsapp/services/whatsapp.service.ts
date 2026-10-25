import {
  WhatsappError,
  type WhatsappActor,
  type WhatsappConnectionInput,
  type WhatsappCredentials,
  type WhatsappSendAttempt,
  type WhatsappConversationSend,
  type WhatsappMessage,
} from "../models/whatsapp.js";
import type {
  WhatsappGateway,
  WhatsappMessageHasher,
  WhatsappRepository,
  WhatsappTokenVault,
} from "../contracts/whatsapp.ports.js";

export class WhatsappService {
  constructor(
    private readonly repository: WhatsappRepository,
    private readonly gateway: WhatsappGateway,
    private readonly vault: WhatsappTokenVault,
    private readonly hasher: WhatsappMessageHasher,
  ) {}

  private scope(actor: WhatsappActor, businessId: string): WhatsappActor {
    if (actor.businessId !== businessId) throw new WhatsappError("WHATSAPP_FORBIDDEN");
    return actor;
  }

  getConnection(actor: WhatsappActor, businessId: string) {
    return this.repository.getConnection(this.scope(actor, businessId));
  }

  async connect(actor: WhatsappActor, businessId: string, input: WhatsappConnectionInput) {
    this.scope(actor, businessId);
    await this.repository.authorize(actor);
    const encryptedAccessToken = this.vault.encrypt(
      input.accessToken,
      businessId,
      input.phoneNumberId,
    );
    const phone = await this.gateway.verifyPhone(input.phoneNumberId, input.accessToken);
    return this.repository.saveConnection(actor, { ...phone, encryptedAccessToken });
  }

  disconnect(actor: WhatsappActor, businessId: string) {
    return this.repository.disconnect(this.scope(actor, businessId));
  }

  getAttempt(actor: WhatsappActor, businessId: string, id: string) {
    return this.repository.getAttempt(this.scope(actor, businessId), id);
  }

  getConversationAttempt(actor: WhatsappActor, businessId: string, threadId: string, key: string) {
    return this.repository.getConversationAttempt(this.scope(actor, businessId), threadId, key);
  }

  async send(
    actor: WhatsappActor,
    businessId: string,
    key: string,
    message: WhatsappMessage,
    conversation?: WhatsappConversationSend,
  ) {
    this.scope(actor, businessId);
    if (
      conversation &&
      (message.type !== "text" ||
        message.to !== conversation.contactWaId ||
        message.text.body !== conversation.body)
    )
      throw new WhatsappError("WHATSAPP_IDEMPOTENCY_CONFLICT");
    const reservation = await this.repository.reserveSend(
      actor,
      key,
      this.hasher.hash(message),
      conversation,
    );
    return this.dispatchReserved(businessId, message, reservation);
  }

  // Used by the authenticated sender and the durable automation worker, only after reservation.
  async dispatchReserved(
    businessId: string,
    message: WhatsappMessage,
    {
      attempt,
      credentials,
    }: {
      attempt: WhatsappSendAttempt;
      credentials: WhatsappCredentials | null;
    },
  ) {
    if (!credentials) return attempt;
    let accessToken: string;
    try {
      accessToken = this.vault.decrypt(
        credentials.encryptedAccessToken,
        businessId,
        credentials.phoneNumberId,
      );
    } catch (error) {
      await this.repository.finishSend(businessId, attempt.id, {
        status: "REJECTED",
        providerMessageId: null,
      });
      throw error;
    }
    const result = await this.gateway.send(credentials.phoneNumberId, accessToken, message);
    return this.repository.finishSend(businessId, attempt.id, result);
  }
}
