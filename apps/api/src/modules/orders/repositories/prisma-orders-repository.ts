import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "../../../database/generated/client.js";
import { authorizeCommerce } from "../../../common/commerce/authorize-commerce.js";
import {
  CommerceError,
  pagination,
  type CommerceActor,
  type CommerceQuery,
} from "../../../common/commerce/commerce.js";
import type { OrderCreate, OrderLineInput, OrderUpdate, OrderView } from "../models/order.js";
import { OrdersRepository } from "./orders.repository.js";
const include = {
  client: true,
  items: { where: { isDeleted: false }, orderBy: { id: "asc" as const } },
} as const;
type Row = Prisma.OrderGetPayload<{ include: typeof include }>;
function view(row: Row): OrderView {
  return {
    id: row.id,
    reference: row.reference,
    version: row.version,
    clientId: row.clientId,
    clientName: row.client && !row.client.isDeleted ? row.client.name : null,
    threadId: row.threadId,
    status: row.status,
    currency: row.currency,
    subtotal: row.items
      .reduce((sum, line) => sum.plus(line.unitPrice.times(line.quantity)), new Prisma.Decimal(0))
      .toFixed(2),
    placedAt: row.placedAt.toISOString(),
    paymentStatus: row.paymentStatus,
    deliveryMode: row.deliveryMode,
    deliveryAddress: row.deliveryAddress,
    deliveryReference: row.deliveryReference,
    latitude: row.deliveryLatitude,
    longitude: row.deliveryLongitude,
    deliveryQuoteStatus: row.deliveryQuoteStatus,
    items: row.items.map((line) => ({
      productId: line.productId,
      name: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice.toFixed(2),
    })),
  };
}
async function client(tx: Prisma.TransactionClient, businessId: string, id: string) {
  const [row] = await tx.$queryRaw<
    { id: string }[]
  >`SELECT "id" FROM "Clients" WHERE "id" = ${id}::uuid AND "businessId" = ${businessId}::uuid AND NOT "isDeleted" AND "active" FOR SHARE`;
  if (!row) throw new CommerceError("COMMERCE_INVALID_CLIENT");
}
async function lines(
  tx: Prisma.TransactionClient,
  businessId: string,
  currency: string,
  input: OrderLineInput[],
) {
  const ids = input.map((line) => line.productId);
  await tx.$queryRaw`SELECT "id" FROM "Products" WHERE "businessId" = ${businessId}::uuid AND "id" IN (${Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))}) ORDER BY "id" FOR SHARE`;
  const products = await tx.product.findMany({
    where: { businessId, id: { in: ids }, isDeleted: false, active: true },
  });
  return input.map((line) => {
    const product = products.find((row) => row.id === line.productId);
    if (!product || product.currency !== currency || product.stock < line.quantity)
      throw new CommerceError("COMMERCE_INVALID_PRODUCTS");
    return {
      businessId,
      productId: product.id,
      productName: product.name,
      quantity: line.quantity,
      unitPrice: product.price,
    };
  });
}
export class PrismaOrdersRepository extends OrdersRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }
  list(actor: CommerceActor, query: CommerceQuery) {
    return this.prisma.$transaction(async (tx) => {
      await authorizeCommerce(tx, actor);
      const base = { businessId: actor.businessId!, isDeleted: false };
      const where: Prisma.OrderWhereInput = {
        ...base,
        ...(query.status ? { status: query.status } : {}),
        ...(query.clientId ? { clientId: query.clientId } : {}),
        ...(query.search
          ? {
              OR: [
                { reference: { contains: query.search, mode: "insensitive" } },
                {
                  client: {
                    isDeleted: false,
                    name: { contains: query.search, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      };
      const [rows, count, groups] = await Promise.all([
        tx.order.findMany({
          where,
          include,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          orderBy: [{ placedAt: "desc" }, { id: "desc" }],
        }),
        tx.order.count({ where }),
        tx.order.groupBy({ by: ["status"], where: base, _count: true }),
      ]);
      const countStatus = (status: string) =>
        groups.find((group) => group.status === status)?._count ?? 0;
      return {
        data: rows.map(view),
        pagination: pagination(query, count),
        summary: {
          total: groups.reduce((sum, group) => sum + group._count, 0),
          draft: countStatus("DRAFT"),
          pending: countStatus("PENDING"),
          paid: countStatus("PAID"),
          shipped: countStatus("SHIPPED"),
          cancelled: countStatus("CANCELLED"),
        },
      };
    });
  }
  get(actor: CommerceActor, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await authorizeCommerce(tx, actor);
      const row = await tx.order.findFirst({
        where: { id, businessId: actor.businessId!, isDeleted: false },
        include,
      });
      if (!row) throw new CommerceError("COMMERCE_NOT_FOUND");
      return view(row);
    });
  }
  private async write<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2034"].includes(error.code)
      )
        throw new CommerceError("COMMERCE_CONFLICT");
      throw error;
    }
  }
  create(actor: CommerceActor, input: OrderCreate) {
    return this.write(() =>
      this.prisma.$transaction(async (tx) => {
        await authorizeCommerce(tx, actor, true);
        const businessId = actor.businessId!;
        const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
        const existing = await tx.order.findUnique({ where: { id: input.id }, include });
        if (existing) {
          if (
            existing.businessId !== businessId ||
            existing.isDeleted ||
            existing.creationHash !== hash
          )
            throw new CommerceError("COMMERCE_CONFLICT");
          return view(existing);
        }
        await client(tx, businessId, input.clientId);
        const business = await tx.business.findUniqueOrThrow({ where: { id: businessId } });
        const items = await lines(tx, businessId, business.currency, input.items);
        return view(
          await tx.order.create({
            data: {
              id: input.id,
              businessId,
              clientId: input.clientId,
              reference: `ORD-${input.id}`,
              status: "DRAFT",
              currency: business.currency,
              creationHash: hash,
              items: { create: items },
            },
            include,
          }),
        );
      }),
    );
  }
  update(actor: CommerceActor, id: string, input: OrderUpdate) {
    return this.write(() =>
      this.prisma.$transaction(async (tx) => {
        await authorizeCommerce(tx, actor, true);
        const businessId = actor.businessId!;
        await tx.$queryRaw`SELECT "id" FROM "Orders" WHERE "id" = ${id}::uuid AND "businessId" = ${businessId}::uuid AND NOT "isDeleted" FOR UPDATE`;
        const row = await tx.order.findFirst({
          where: { id, businessId, isDeleted: false },
          include,
        });
        if (!row) throw new CommerceError("COMMERCE_NOT_FOUND");
        if (row.version !== input.version) throw new CommerceError("COMMERCE_CONFLICT");
        if ((input.items || input.clientId) && (row.status !== "DRAFT" || row.threadId))
          throw new CommerceError("COMMERCE_INVALID_TRANSITION");
        if (input.clientId) await client(tx, businessId, input.clientId);
        const status = input.status ?? row.status;
        if (status !== row.status) {
          const allowed =
            (row.status === "DRAFT" && !row.threadId && status === "PENDING") ||
            (["DRAFT", "PENDING"].includes(row.status) && status === "CANCELLED") ||
            (row.status === "PENDING" && row.paymentStatus === "VALIDATED" && status === "PAID") ||
            (row.status === "PAID" && status === "SHIPPED");
          if (!allowed) throw new CommerceError("COMMERCE_INVALID_TRANSITION");
          if (status === "PENDING") {
            if (!row.clientId) throw new CommerceError("COMMERCE_INVALID_CLIENT");
            await client(tx, businessId, row.clientId);
            const current = await lines(tx, businessId, row.currency, row.items);
            if (
              !current.length ||
              current.some(
                (line, index) =>
                  !line.unitPrice.equals(row.items[index]!.unitPrice) ||
                  line.productName !== row.items[index]!.productName,
              )
            )
              throw new CommerceError("COMMERCE_INVALID_PRODUCTS");
          }
        }
        const items = input.items
          ? await lines(tx, businessId, row.currency, input.items)
          : undefined;
        if (items)
          await tx.orderItem.updateMany({
            where: { businessId, orderId: id, isDeleted: false },
            data: { isDeleted: true },
          });
        return view(
          await tx.order.update({
            where: { id },
            data: {
              status,
              ...(input.clientId ? { clientId: input.clientId } : {}),
              ...(items ? { items: { create: items } } : {}),
              version: { increment: 1 },
              confirmationToken: null,
              confirmationJobId: null,
            },
            include,
          }),
        );
      }),
    );
  }
}
