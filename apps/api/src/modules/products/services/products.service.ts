import { Inject, Injectable } from "@nestjs/common";
import {
  PRODUCTS_REPOSITORY,
  type IProductsRepository,
} from "../repositories/products.repository.js";
import {
  ProductError,
  type ProductActor,
  type ProductInput,
  type ProductListQuery,
} from "../models/product.js";
import {
  PRODUCT_IMAGE_NORMALIZER,
  type IProductImageNormalizer,
} from "../contracts/product-image-normalizer.js";

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCTS_REPOSITORY) private readonly repository: IProductsRepository,
    @Inject(PRODUCT_IMAGE_NORMALIZER) private readonly imageNormalizer: IProductImageNormalizer,
  ) {}

  private scope(actor: ProductActor, businessId: string): ProductActor {
    if (actor.businessId !== businessId) throw new ProductError("PRODUCT_FORBIDDEN");
    return actor;
  }

  async uploadImage(actor: ProductActor, businessId: string, input?: Uint8Array) {
    const scope = this.scope(actor, businessId);
    await this.repository.checkImageWriteAccess(scope);
    const data = await this.imageNormalizer.normalize(input);
    return this.repository.createImage(scope, data);
  }

  getImage(actor: ProductActor, businessId: string, id: string) {
    return this.repository.getImage(this.scope(actor, businessId), id);
  }

  listCategories(actor: ProductActor, businessId: string) {
    return this.repository.listCategories(this.scope(actor, businessId));
  }

  createCategory(actor: ProductActor, businessId: string, name: string) {
    return this.repository.createCategory(this.scope(actor, businessId), name);
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
