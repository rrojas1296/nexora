import type { WhatsappActor } from "../models/whatsapp.js";

export interface CommerceOrderView {
  id: string;
  reference: string;
  version: number;
  status: string;
  currency: string;
  subtotal: string;
  paymentStatus: string;
  deliveryMode: string;
  deliveryAddress: string;
  deliveryReference: string;
  latitude: number | null;
  longitude: number | null;
  deliveryQuoteStatus: string;
  items: { productId: string; name: string; quantity: number; unitPrice: string }[];
  proofs: { id: string; messageId: string; status: string; revision: number }[];
}
export interface ProofReview {
  status: "VALIDATED" | "REJECTED";
  revision: number;
  orderVersion: number;
}
export interface WhatsappCommerceRepository {
  orders(
    actor: WhatsappActor,
    threadId: string,
    cursor?: string,
  ): Promise<{ items: CommerceOrderView[]; nextCursor: string | null }>;
  media(
    actor: WhatsappActor,
    threadId: string,
    messageId: string,
  ): Promise<{ bytes: Uint8Array; mime: string }>;
  review(
    actor: WhatsappActor,
    threadId: string,
    orderId: string,
    proofId: string,
    input: ProofReview,
  ): Promise<CommerceOrderView>;
}
