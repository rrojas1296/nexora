import type {
  BusinessProfile,
  CreateBusinessInput,
  UpdateBusinessInput,
} from "../models/business.js";

export const BUSINESS_REPOSITORY = Symbol("BusinessRepository");

export interface IBusinessRepository {
  get(businessId: string, userId: string): Promise<BusinessProfile | null>;
  create(userId: string, input: CreateBusinessInput): Promise<BusinessProfile | null>;
  update(
    businessId: string,
    userId: string,
    input: UpdateBusinessInput,
  ): Promise<BusinessProfile | null>;
}
