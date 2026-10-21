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
  ): Promise<T> {
    try {
      return await this.client.$transaction(async (tx) => {
        await this.authorize(tx, actor, true);
        return operation(tx);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ProductError("PRODUCT_SKU_EXISTS");
      }
      throw error;
    }
  }

  create(actor: ProductActor, input: ProductInput) {
    return this.write(actor, async (tx) =>
      serialize(
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
      ),
    );
  }

  update(actor: ProductActor, id: string, input: Partial<ProductInput>) {
    return this.write(actor, async (tx) => {
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
