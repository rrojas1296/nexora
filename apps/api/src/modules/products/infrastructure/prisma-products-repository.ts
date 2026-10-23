import {
  Prisma,
  type PrismaClient,
  type Product as ProductRecord,
} from "../../../infrastructure/database/generated/client.js";
import type { ProductsRepository } from "../application/products.repository.js";
import {
  ProductError,
  type Product,
  type ProductActor,
  type ProductInput,
  type ProductListQuery,
  type ProductSummary,
} from "../domain/product.js";

type Transaction = Prisma.TransactionClient;

function serialize(product: ProductRecord): Product {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    category: product.category,
    imageUrl: product.imageUrl,
    brand: product.brand,
    supplier: product.supplier,
    barcode: product.barcode,
    price: product.price.toFixed(2),
    cost: product.cost.toFixed(2),
    compareAtPrice: product.compareAtPrice?.toFixed(2) ?? "0.00",
    currency: product.currency,
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    weight: product.weightGrams,
    active: product.active,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function productData(input: Partial<ProductInput>) {
  const { weight, ...fields } = input;
  return { ...fields, ...(weight === undefined ? {} : { weightGrams: weight }) };
}

export class PrismaProductsRepository implements ProductsRepository {
  constructor(private readonly client: PrismaClient) {}

  private async authorize(tx: Transaction, actor: ProductActor, write = false) {
    // Hold the membership/business through the operation: role changes and logical
    // business deletion cannot race a successful permission check and mutation.
    const [membership] = await tx.$queryRaw<{ role: string }[]>`
      SELECT m."role"::text AS "role" FROM "Memberships" m
      JOIN "Businesses" b ON b."id" = m."businessId"
      JOIN "Users" u ON u."id" = m."userId"
      JOIN "AuthSessions" s ON s."businessId" = m."businessId" AND s."userId" = m."userId"
      WHERE m."businessId" = ${actor.businessId}::uuid AND m."userId" = ${actor.userId}::uuid
        AND m."active" AND NOT m."isDeleted" AND NOT b."isDeleted"
        AND u."active" AND NOT u."isDeleted"
        AND s."id" = ${actor.sessionId}::uuid AND NOT s."isDeleted" AND s."revokedAt" IS NULL
        AND s."expiresAt" > CURRENT_TIMESTAMP AND s."idleExpiresAt" > CURRENT_TIMESTAMP
      FOR SHARE OF m, b
    `;
    if (!membership || (write && !["OWNER", "ADMIN"].includes(membership.role))) {
      throw new ProductError("PRODUCT_FORBIDDEN");
    }
  }

  checkImageWriteAccess(actor: ProductActor) {
    return this.write(actor, async () => {});
  }

  createImage(actor: ProductActor, data: Uint8Array) {
    return this.write(actor, async (tx) => {
      // Serialize uploads for this business so concurrent requests cannot exceed its quota.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(72001, hashtext(${actor.businessId}))`;
      const count = await tx.productImage.count({ where: { businessId: actor.businessId } });
      if (count >= 1000) throw new ProductError("PRODUCT_IMAGE_LIMIT");
      const image = await tx.productImage.create({
        data: { businessId: actor.businessId, data: new Uint8Array(data) },
      });
      return `/api/v1/businesses/${actor.businessId}/products/images/${image.id}`;
    });
  }

  getImage(actor: ProductActor, id: string) {
    return this.client.$transaction(async (tx) => {
      await this.authorize(tx, actor);
      const image = await tx.productImage.findFirst({
        where: { id, businessId: actor.businessId, isDeleted: false },
        select: { id: true, data: true },
      });
      if (!image) throw new ProductError("PRODUCT_NOT_FOUND");
      return image;
    });
  }

  private async validateImage(tx: Transaction, actor: ProductActor, url?: string) {
    if (!url?.startsWith("/")) return;
    const prefix = `/api/v1/businesses/${actor.businessId}/products/images/`;
    if (!url.startsWith(prefix)) throw new ProductError("PRODUCT_IMAGE_INVALID");
    const image = await tx.productImage.findFirst({
      where: { id: url.slice(prefix.length), businessId: actor.businessId, isDeleted: false },
      select: { id: true },
    });
    if (!image) throw new ProductError("PRODUCT_IMAGE_INVALID");
  }

  listCategories(actor: ProductActor) {
    return this.client.$transaction(async (tx) => {
      await this.authorize(tx, actor);
      return tx.productCategory.findMany({
        where: { businessId: actor.businessId, isDeleted: false },
        select: { id: true, name: true },
        orderBy: [{ name: "asc" }, { id: "asc" }],
      });
    });
  }

  createCategory(actor: ProductActor, name: string) {
    return this.write(
      actor,
      (tx) =>
        tx.productCategory.create({
          data: { businessId: actor.businessId, name },
          select: { id: true, name: true },
        }),
      "PRODUCT_CATEGORY_EXISTS",
    );
  }

  private async validateCategory(tx: Transaction, actor: ProductActor, name?: string) {
    if (name === undefined) return;
    const category = await tx.productCategory.findFirst({
      where: { businessId: actor.businessId, name, isDeleted: false },
      select: { id: true },
    });
    if (!category) throw new ProductError("PRODUCT_CATEGORY_INVALID");
  }

  private summary(tx: Transaction, actor: ProductActor) {
    return tx.$queryRaw<ProductSummary[]>`
      SELECT COUNT(*)::int AS "catalog",
        COUNT(*) FILTER (WHERE "active")::int AS "available",
        COUNT(*) FILTER (WHERE "active" AND "stock" <= "lowStockThreshold")::int AS "lowStock",
        COALESCE(SUM("price" * "stock"), 0)::numeric(38,2)::text AS "inventoryValue"
      FROM "Products" WHERE "businessId" = ${actor.businessId}::uuid AND NOT "isDeleted"
    `;
  }

  list(actor: ProductActor, query: ProductListQuery) {
    return this.client.$transaction(
      async (tx) => {
        await this.authorize(tx, actor);
        const where: Prisma.ProductWhereInput = {
          businessId: actor.businessId,
          isDeleted: false,
          ...(query.status === "all" ? {} : { active: query.status === "active" }),
          ...(query.search
            ? {
                OR: [
                  { name: { contains: query.search, mode: "insensitive" } },
                  { sku: { contains: query.search, mode: "insensitive" } },
                ],
              }
            : {}),
        };
        const total = await tx.product.count({ where });
        const pages = Math.max(1, Math.ceil(total / query.pageSize));
        const page = Math.min(query.page, pages);
        const rows = await tx.product.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (page - 1) * query.pageSize,
          take: query.pageSize,
        });
        const [summary] = await this.summary(tx, actor);
        return {
          data: rows.map(serialize),
          pagination: { page, pageSize: query.pageSize, total, pages },
          summary: summary!,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  get(actor: ProductActor, id: string) {
    return this.client.$transaction(async (tx) => {
      await this.authorize(tx, actor);
      const product = await tx.product.findFirst({
        where: { id, businessId: actor.businessId, isDeleted: false },
      });
      if (!product) throw new ProductError("PRODUCT_NOT_FOUND");
      return serialize(product);
    });
  }

  private async write<T>(
    actor: ProductActor,
    operation: (tx: Transaction) => Promise<T>,
    conflict: "PRODUCT_SKU_EXISTS" | "PRODUCT_CATEGORY_EXISTS" = "PRODUCT_SKU_EXISTS",
  ): Promise<T> {
    try {
      return await this.client.$transaction(async (tx) => {
        await this.authorize(tx, actor, true);
        return operation(tx);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ProductError(conflict);
      }
      throw error;
    }
  }

  create(actor: ProductActor, input: ProductInput) {
    return this.write(actor, async (tx) => {
      await this.validateCategory(tx, actor, input.category);
      await this.validateImage(tx, actor, input.imageUrl);
      return serialize(
        await tx.product.create({
          data: {
            ...productData(input),
            name: input.name,
            sku: input.sku,
            price: input.price,
            businessId: actor.businessId,
            currency: "PEN",
          },
        }),
      );
    });
  }

  update(actor: ProductActor, id: string, input: Partial<ProductInput>) {
    return this.write(actor, async (tx) => {
      await this.validateCategory(tx, actor, input.category);
      await this.validateImage(tx, actor, input.imageUrl);
      const [product] = await tx.product.updateManyAndReturn({
        where: { id, businessId: actor.businessId, isDeleted: false },
        data: productData(input),
      });
      if (!product) throw new ProductError("PRODUCT_NOT_FOUND");
      return serialize(product);
    });
  }

  delete(actor: ProductActor, id: string) {
    return this.write(actor, async (tx) => {
      const rows = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "Products" WHERE "id" = ${id}::uuid AND "businessId" = ${actor.businessId}::uuid AND NOT "isDeleted" FOR UPDATE
      `;
      if (!rows.length) throw new ProductError("PRODUCT_NOT_FOUND");
      // Historical links also count: soft-deleting a line must not permit losing its catalog reference.
      const linked = await tx.orderItem.count({
        where: { businessId: actor.businessId, productId: id },
      });
      if (linked) throw new ProductError("PRODUCT_HAS_ORDERS");
      await tx.product.updateMany({
        where: { id, businessId: actor.businessId, isDeleted: false },
        data: { isDeleted: true, active: false },
      });
    });
  }
}
