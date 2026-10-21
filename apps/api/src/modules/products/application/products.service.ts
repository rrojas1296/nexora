import {
  ProductError,
  type ProductActor,
  type ProductInput,
  type ProductListQuery,
} from "../domain/product.js";
import type { ProductsRepository } from "./products.repository.js";

export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  private scope(actor: ProductActor, businessId: string): ProductActor {
    if (actor.businessId !== businessId) throw new ProductError("PRODUCT_FORBIDDEN");
    return actor;
  }

  list(actor: ProductActor, businessId: string, query: ProductListQuery) {
    return this.repository.list(this.scope(actor, businessId), query);
  }

  get(actor: ProductActor, businessId: string, id: string) {
    return this.repository.get(this.scope(actor, businessId), id);
  }

  create(actor: ProductActor, businessId: string, input: ProductInput) {
    return this.repository.create(this.scope(actor, businessId), input);
  }

  update(actor: ProductActor, businessId: string, id: string, input: Partial<ProductInput>) {
    return this.repository.update(this.scope(actor, businessId), id, input);
  }

  delete(actor: ProductActor, businessId: string, id: string) {
    return this.repository.delete(this.scope(actor, businessId), id);
  }
}
