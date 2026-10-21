"use client";

import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/api-error";
import { authService, withAuthenticatedSession } from "@/features/auth/services/auth-service";
import {
  agentReadResponseSchema,
  agentResponseSchema,
  type AgentInput,
  type AgentScope,
} from "../schemas/agent-schema";

function agentUrl(scope: AgentScope) {
  return `/businesses/${scope.businessId}/agents/configuration`;
}

export const agentService = {
  async get(scope: AgentScope, signal: AbortSignal) {
    const read = async () => {
      const response = await apiClient.get(agentUrl(scope), { signal });
      return agentReadResponseSchema.parse(response.data).data;
    };
    try {
      return await read();
    } catch (error) {
      signal.throwIfAborted();
      if (normalizeApiError(error).status !== 401) throw error;
      const session = await authService.current();
      signal.throwIfAborted();
      if (!session) throw new Error("AUTHENTICATED_SESSION_REQUIRED");
      if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId) {
        throw new Error("SESSION_CHANGED");
      }
      return read();
    }
  },
  save(scope: AgentScope, input: AgentInput) {
    return withAuthenticatedSession(async (session, headers) => {
      if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId) {
        throw new Error("SESSION_CHANGED");
      }
      const response = await apiClient.put(agentUrl(scope), input, { headers });
      return agentResponseSchema.parse(response.data).data;
    });
  },
};
