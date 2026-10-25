import type {
  BusinessActor,
  CreateBusinessInput,
  UpdateBusinessInput,
} from "../models/business.js";
import type { BusinessRepository } from "../repositories/business.repository.js";

export class BusinessService {
  constructor(private readonly repository: BusinessRepository) {}

  get(actor: BusinessActor, businessId: string) {
    if (actor.activeBusinessId !== businessId) return Promise.resolve(null);
    return this.repository.get(businessId, actor.userId);
  }

  create(actor: BusinessActor, input: CreateBusinessInput) {
    return this.repository.create(actor.userId, input);
  }

  update(actor: BusinessActor, businessId: string, input: UpdateBusinessInput) {
    if (actor.activeBusinessId !== businessId) return Promise.resolve(null);
    return this.repository.update(businessId, actor.userId, input);
  }
}
