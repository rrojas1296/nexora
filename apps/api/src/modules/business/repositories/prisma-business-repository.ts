import type { PrismaClient } from "../../../database/generated/client.js";
import type { BusinessRepository } from "./business.repository.js";
import type { BusinessProfile } from "../models/business.js";

export class PrismaBusinessRepository implements BusinessRepository {
  constructor(private readonly client: PrismaClient) {}

  async updateName(
    businessId: string,
    userId: string,
    name: string,
  ): Promise<BusinessProfile | null> {
    // Authorization and update share one statement; no client-supplied role is trusted.
    const [business] = await this.client.business.updateManyAndReturn({
      where: {
        id: businessId,
        isDeleted: false,
        memberships: {
          some: {
            userId,
            active: true,
            isDeleted: false,
            role: { in: ["OWNER", "ADMIN"] },
            user: { active: true, isDeleted: false },
          },
        },
      },
      data: { name },
      select: { id: true, name: true, slug: true },
    });
    return business ?? null;
  }
}
