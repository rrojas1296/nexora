import { createHash } from "node:crypto";
import { Prisma, type PrismaClient } from "../../../database/generated/client.js";
import { authorizeCommerce } from "../../../common/commerce/authorize-commerce.js";
import {
  CommerceError,
  pagination,
  type CommerceActor,
  type CommerceQuery,
} from "../../../common/commerce/commerce.js";
import type { ClientInput, ClientView } from "../models/client.js";
import { ClientsRepository } from "./clients.repository.js";
const include = { _count: { select: { orders: { where: { isDeleted: false } } } } } as const;
type Row = Prisma.ClientGetPayload<{ include: typeof include }>;
function view(row: Row): ClientView {
  return {
    id: row.id,
    version: row.version,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    taxId: row.taxId,
    segment: row.segment === "VIP" ? "vip" : row.segment === "WHOLESALE" ? "wholesale" : "retail",
    active: row.active,
    address: row.address,
    city: row.city,
    region: row.region,
    postalCode: row.postalCode,
    country: row.country,
    language: row.language,
    notes: row.notes,
    marketingConsent: row.marketingConsent,
    createdAt: row.createdAt.toISOString(),
    ordersCount: row._count.orders,
  };
}
function data(input: ClientInput) {
  return {
    ...input,
    segment:
      input.segment === "vip"
        ? ("VIP" as const)
        : input.segment === "wholesale"
          ? ("WHOLESALE" as const)
          : ("RETAIL" as const),
  };
}
export class PrismaClientsRepository extends ClientsRepository {
  constructor(private readonly prisma: PrismaClient) {
    super();
  }
  list(actor: CommerceActor, query: CommerceQuery) {
    return this.prisma.$transaction(async (tx) => {
      await authorizeCommerce(tx, actor);
      const base = { businessId: actor.businessId!, isDeleted: false };
      const where: Prisma.ClientWhereInput = {
        ...base,
        ...(query.search
          ? {
              OR: ["name", "email", "phone", "company"].map((key) => ({
                [key]: { contains: query.search, mode: "insensitive" },
              })),
            }
          : {}),
      };
      const [rows, count, total, active, vip] = await Promise.all([
        tx.client.findMany({
          where,
          include,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        tx.client.count({ where }),
        tx.client.count({ where: base }),
        tx.client.count({ where: { ...base, active: true } }),
        tx.client.count({ where: { ...base, segment: "VIP" } }),
      ]);
      return {
        data: rows.map(view),
        pagination: pagination(query, count),
        summary: { total, active, vip },
      };
    });
  }
  get(actor: CommerceActor, id: string) {
    return this.prisma.$transaction(async (tx) => {
      await authorizeCommerce(tx, actor);
      const row = await tx.client.findFirst({
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
  create(actor: CommerceActor, input: ClientInput & { id: string }) {
    return this.write(() =>
      this.prisma.$transaction(async (tx) => {
        await authorizeCommerce(tx, actor, true);
        const hash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
        const existing = await tx.client.findFirst({ where: { id: input.id }, include });
        if (existing) {
          if (
            existing.businessId !== actor.businessId ||
            existing.isDeleted ||
            existing.creationHash !== hash
          )
            throw new CommerceError("COMMERCE_CONFLICT");
          return view(existing);
        }
        const { id, ...fields } = input;
        return view(
          await tx.client.create({
            data: { ...data(fields), id, businessId: actor.businessId!, creationHash: hash },
            include,
          }),
        );
      }),
    );
  }
  update(actor: CommerceActor, id: string, input: ClientInput & { version: number }) {
    return this.write(() =>
      this.prisma.$transaction(async (tx) => {
        await authorizeCommerce(tx, actor, true);
        const { version, ...fields } = input;
        const changed = await tx.client.updateMany({
          where: { id, businessId: actor.businessId!, isDeleted: false, version },
          data: { ...data(fields), version: { increment: 1 } },
        });
        if (!changed.count) throw new CommerceError("COMMERCE_CONFLICT");
        return view(
          await tx.client.findFirstOrThrow({
            where: { id, businessId: actor.businessId!, isDeleted: false },
            include,
          }),
        );
      }),
    );
  }
}
