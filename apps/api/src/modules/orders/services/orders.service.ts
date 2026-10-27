import {
  checkBusiness,
  type CommerceActor,
  type CommerceQuery,
} from "../../../common/commerce/commerce.js";
import type { OrderCreate, OrderUpdate } from "../models/order.js";
import { OrdersRepository } from "../repositories/orders.repository.js";
export class OrdersService {
  constructor(private readonly repository: OrdersRepository) {}
  list(actor: CommerceActor, businessId: string, query: CommerceQuery) {
    checkBusiness(actor, businessId);
    return this.repository.list(actor, query);
  }
  get(actor: CommerceActor, businessId: string, id: string) {
    checkBusiness(actor, businessId);
    return this.repository.get(actor, id);
  }
  create(actor: CommerceActor, businessId: string, input: OrderCreate) {
    checkBusiness(actor, businessId);
    return this.repository.create(actor, input);
  }
  update(actor: CommerceActor, businessId: string, id: string, input: OrderUpdate) {
    checkBusiness(actor, businessId);
    return this.repository.update(actor, id, input);
  }
}
