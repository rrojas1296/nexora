import type { CommerceActor, CommerceQuery } from "../../../common/commerce/commerce.js";
import type { OrderCreate, OrderUpdate, OrderView } from "../models/order.js";
export abstract class OrdersRepository {
  abstract list(
    actor: CommerceActor,
    query: CommerceQuery,
  ): Promise<{
    data: OrderView[];
    pagination: { page: number; pageSize: number; total: number; pages: number };
    summary: {
      total: number;
      draft: number;
      pending: number;
      paid: number;
      shipped: number;
      cancelled: number;
    };
  }>;
  abstract get(actor: CommerceActor, id: string): Promise<OrderView>;
  abstract create(actor: CommerceActor, input: OrderCreate): Promise<OrderView>;
  abstract update(actor: CommerceActor, id: string, input: OrderUpdate): Promise<OrderView>;
}
