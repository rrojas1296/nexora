"use client";

import { apiClient } from "@/lib/api/client";
import { authService, withAuthenticatedSession } from "@/features/auth/services/auth-service";
import {
  businessResponseSchema,
  type BusinessInput,
  type BusinessScope,
} from "../schemas/business-schema";

export const businessesService = {
  async get(scope: BusinessScope, signal: AbortSignal) {
    const session = await authService.current();
    signal.throwIfAborted();
    if (session?.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
      throw new Error("SESSION_CHANGED");
    const response = await apiClient.get(`/businesses/${scope.businessId}`, { signal });
    return businessResponseSchema.parse(response.data).data;
  },
  create(userId: string, id: string, input: BusinessInput) {
    return withAuthenticatedSession(async (session, headers) => {
      if (session.user.id !== userId) throw new Error("SESSION_CHANGED");
      const response = await apiClient.post("/businesses", { id, ...input }, { headers });
      return businessResponseSchema.parse(response.data).data;
    });
  },
  save(scope: BusinessScope, input: BusinessInput, revision: number, publish: boolean) {
    return withAuthenticatedSession(async (session, headers) => {
      if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
        throw new Error("SESSION_CHANGED");
      const { agentName: _name, agentTone: _tone, ...settings } = input;
      const response = await apiClient.patch(
        `/businesses/${scope.businessId}`,
        { ...settings, revision, publish },
        { headers },
      );
      return businessResponseSchema.parse(response.data).data;
    });
  },
};
