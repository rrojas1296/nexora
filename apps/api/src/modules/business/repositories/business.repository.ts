import type { BusinessProfile } from "../models/business.js";

export interface BusinessRepository {
  // Update only with an active OWNER/ADMIN membership and an active user.
  updateName(businessId: string, userId: string, name: string): Promise<BusinessProfile | null>;
}
