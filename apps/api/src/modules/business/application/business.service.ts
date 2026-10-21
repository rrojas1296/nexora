import type { BusinessActor, BusinessProfile } from "../domain/business.js";
import type { BusinessRepository } from "./business.repository.js";

export class BusinessService {
  constructor(private readonly repository: BusinessRepository) {}

  async updateName(
    actor: BusinessActor,
    businessId: string,
    name: string,
  ): Promise<BusinessProfile | null> {
    if (actor.activeBusinessId !== businessId) return null;
    return this.repository.updateName(businessId, actor.userId, name);
  }
}
