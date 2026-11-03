export const WHATSAPP_WEBHOOK_SECURITY = Symbol("IWhatsappWebhookSecurity");

export interface IWhatsappWebhookSecurity {
  verifySubscriptionToken(token: string): boolean;
  verifySignature(body: Buffer<ArrayBufferLike>, signature: string | undefined): boolean;
}
