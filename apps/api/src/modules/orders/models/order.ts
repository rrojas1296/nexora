export type OrderStatus = "DRAFT" | "PENDING" | "PAID" | "SHIPPED" | "CANCELLED";
export interface OrderLineInput {
  productId: string;
  quantity: number;
}
export interface OrderCreate {
  id: string;
  clientId: string;
  items: OrderLineInput[];
}
export interface OrderUpdate {
  version: number;
  clientId?: string;
  items?: OrderLineInput[];
  status?: OrderStatus;
}
export interface OrderView {
  id: string;
  reference: string;
  version: number;
  clientId: string | null;
  clientName: string | null;
  threadId: string | null;
  status: OrderStatus;
  currency: string;
  subtotal: string;
  placedAt: string;
  paymentStatus: string;
  deliveryMode: string;
  deliveryAddress: string;
  deliveryReference: string;
  latitude: number | null;
  longitude: number | null;
  deliveryQuoteStatus: string;
  items: { productId: string; name: string; quantity: number; unitPrice: string }[];
}
