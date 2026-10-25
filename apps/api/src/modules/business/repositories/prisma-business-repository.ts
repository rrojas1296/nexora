import type { PrismaClient } from "../../../database/generated/client.js";
import type { BusinessRepository } from "./business.repository.js";
import type {
  BusinessProfile,
  CreateBusinessInput,
  UpdateBusinessInput,
} from "../models/business.js";

const profile = {
  id: true,
  name: true,
  slug: true,
  description: true,
  currency: true,
  timezone: true,
  contextDraft: true,
  contextPublished: true,
  contextVersion: true,
  contextPublishedAt: true,
  revision: true,
} as const;

function membership(userId: string, write = false) {
  return {
    userId,
    active: true,
    isDeleted: false,
    user: { active: true, isDeleted: false },
    ...(write ? { role: { in: ["OWNER", "ADMIN"] as ("OWNER" | "ADMIN")[] } } : {}),
  };
}

export class PrismaBusinessRepository implements BusinessRepository {
  constructor(private readonly client: PrismaClient) {}

  get(businessId: string, userId: string): Promise<BusinessProfile | null> {
    return this.client.business.findFirst({
      where: { id: businessId, isDeleted: false, memberships: { some: membership(userId) } },
      select: profile,
    });
  }

  create(userId: string, input: CreateBusinessInput): Promise<BusinessProfile | null> {
    return this.client.$transaction(async (tx) => {
      // Serialize duplicate requests from the same account, without replaying mutations.
      await tx.$queryRaw`SELECT "id" FROM "Users" WHERE "id" = ${userId}::uuid FOR NO KEY UPDATE`;
      const user = await tx.user.findFirst({
        where: { id: userId, active: true, isDeleted: false },
      });
      if (!user) return null;
      const existing = await tx.business.findUnique({
        where: { id: input.id },
        select: {
          ...profile,
          memberships: { where: { userId, role: "OWNER", active: true, isDeleted: false } },
          isDeleted: true,
        },
      });
      if (existing) {
        const { isDeleted, memberships, ...business } = existing;
        return !isDeleted && memberships.length ? business : null;
      }
      const { agentName, agentTone, ...data } = input;
      const tones = {
        friendly: "FRIENDLY",
        professional: "PROFESSIONAL",
        concise: "CONCISE",
      } as const;
      return tx.business.create({
        data: {
          ...data,
          slug: `business-${input.id}`,
          memberships: { create: { userId, role: "OWNER" } },
          agents: {
            create: {
              name: agentName,
              tone: tones[agentTone],
              instructions: "",
              greeting: "",
              active: false,
            },
          },
        },
        select: profile,
      });
    });
  }

  update(
    businessId: string,
    userId: string,
    input: UpdateBusinessInput,
  ): Promise<BusinessProfile | null> {
    return this.client.$transaction(async (tx) => {
      // Version checks and publication share one locked snapshot.
      await tx.$queryRaw`SELECT "id" FROM "Businesses" WHERE "id" = ${businessId}::uuid FOR UPDATE`;
      const current = await tx.business.findFirst({
        where: {
          id: businessId,
          isDeleted: false,
          memberships: { some: membership(userId, true) },
        },
        select: profile,
      });
      if (!current || (input.revision !== undefined && current.revision !== input.revision))
        return null;
      // Never reinterpret persisted prices in a different currency, even for archived products.
      if (
        input.currency &&
        input.currency !== current.currency &&
        (await tx.product.count({ where: { businessId } }))
      )
        return null;
      const { revision: _revision, publish, ...data } = input;
      return tx.business.update({
        where: { id: businessId },
        data: {
          ...data,
          revision: { increment: 1 },
          ...(publish
            ? {
                contextPublished: input.contextDraft ?? current.contextDraft,
                contextVersion: { increment: 1 },
                contextPublishedAt: new Date(),
              }
            : {}),
        },
        select: profile,
      });
    });
  }
}
