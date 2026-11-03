import type {
  Product,
  ProductActor,
  ProductCategory,
  ProductInput,
  ProductList,
  ProductListQuery,
  StoredProductImage,
} from "../models/product.js";

export const PRODUCTS_REPOSITORY = Symbol("ProductsRepository");

export interface IProductsRepository {
  checkImageWriteAccess(actor: ProductActor): Promise<void>;
  createImage(actor: ProductActor, data: Uint8Array): Promise<string>;
  getImage(actor: ProductActor, id: string): Promise<StoredProductImage>;
  listCategories(actor: ProductActor): Promise<ProductCategory[]>;
  createCategory(actor: ProductActor, name: string): Promise<ProductCategory>;
  list(actor: ProductActor, query: ProductListQuery): Promise<ProductList>;
  get(actor: ProductActor, id: string): Promise<Product>;
  create(actor: ProductActor, input: ProductInput): Promise<Product>;
  update(actor: ProductActor, id: string, input: Partial<ProductInput>): Promise<Product>;
  delete(actor: ProductActor, id: string): Promise<void>;
}
