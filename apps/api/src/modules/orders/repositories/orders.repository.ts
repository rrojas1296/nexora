import type { CommerceActor, CommerceQuery } from "../../../common/commerce/commerce.js";
import type { OrderCreate, OrderUpdate, OrderView } from "../models/order.js";
export const ORDERS_REPOSITORY = Symbol("OrdersRepository");

export interface IOrdersRepository {
  list(
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
  get(actor: CommerceActor, id: string): Promise<OrderView>;
  create(actor: CommerceActor, input: OrderCreate): Promise<OrderView>;
  update(actor: CommerceActor, id: string, input: OrderUpdate): Promise<OrderView>;
}
