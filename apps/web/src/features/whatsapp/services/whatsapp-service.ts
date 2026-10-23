"use client";

import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/api-error";
import { authService, withAuthenticatedSession } from "@/features/auth/services/auth-service";
import {
  authorizationAttemptSchema,
  authorizationUrlSchema,
  connectionResponseSchema,
  type WhatsappScope,
} from "../schemas/whatsapp-schema";

function url(scope: WhatsappScope) {
  return `/businesses/${scope.businessId}/whatsapp`;
}
function assertScope(
  scope: WhatsappScope,
  session: { user: { id: string }; activeBusinessId: string },
) {
  if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
    throw new Error("SESSION_CHANGED");
}
async function read<T>(
  scope: WhatsappScope,
  signal: AbortSignal,
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    signal.throwIfAborted();
    if (normalizeApiError(error).status !== 401) throw error;
    const session = await authService.current();
    signal.throwIfAborted();
    if (!session) throw new Error("SESSION_CHANGED");
    assertScope(scope, session);
    return operation();
  }
}

export const whatsappService = {
  connection(scope: WhatsappScope, signal: AbortSignal) {
    return read(
      scope,
      signal,
      async () =>
        connectionResponseSchema.parse(
          (await apiClient.get(`${url(scope)}/connection`, { signal })).data,
        ).data,
    );
  },
  start(scope: WhatsappScope, locale: string) {
    return withAuthenticatedSession(async (session, headers) => {
      assertScope(scope, session);
      const response = await apiClient.post(`${url(scope)}/authorization`, { locale }, { headers });
      return authorizationUrlSchema.parse(response.data).data.authorizationUrl;
    });
  },
  attempt(scope: WhatsappScope, attemptId: string, signal: AbortSignal) {
    return read(
      scope,
      signal,
      async () =>
        authorizationAttemptSchema.parse(
          (await apiClient.get(`${url(scope)}/authorization/${attemptId}`, { signal })).data,
        ).data,
    );
  },
  complete(
    scope: WhatsappScope,
    input: { attemptId: string; phoneNumberId: string; wabaId: string },
  ) {
    return withAuthenticatedSession(async (session, headers) => {
      assertScope(scope, session);
      const response = await apiClient.post(`${url(scope)}/authorization/complete`, input, {
        headers,
        timeout: 75_000,
      });
      return connectionResponseSchema.parse(response.data).data;
    });
  },
  disconnect(scope: WhatsappScope) {
    return withAuthenticatedSession(async (session, headers) => {
      assertScope(scope, session);
      await apiClient.delete(`${url(scope)}/connection`, { headers });
    });
  },
};
