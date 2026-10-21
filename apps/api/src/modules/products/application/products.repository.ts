import type {
  Product,
  ProductActor,
  ProductInput,
  ProductList,
  ProductListQuery,
} from "../domain/product.js";

export interface ProductsRepository {
  list(actor: ProductActor, query: ProductListQuery): Promise<ProductList>;
  get(actor: ProductActor, id: string): Promise<Product>;
  create(actor: ProductActor, input: ProductInput): Promise<Product>;
  update(actor: ProductActor, id: string, input: Partial<ProductInput>): Promise<Product>;
  delete(actor: ProductActor, id: string): Promise<void>;
}
