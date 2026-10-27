"use client";

import {
  conversationOrderResponse,
  conversationOrdersResponse,
  type ReviewProofInput,
} from "../schemas/commerce-schema";
import { apiClient } from "@/lib/api/client";
import { normalizeApiError } from "@/lib/api/api-error";
import { authService, withAuthenticatedSession } from "@/features/auth/services/auth-service";
import {
  messageResponseSchema,
  controlResponseSchema,
  sendAttemptResponseSchema,
  sendTextSchema,
  threadResponseSchema,
  type InboxScope,
} from "../schemas/inbox-schema";

async function read<T>(
  scope: InboxScope,
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
    if (session?.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
      throw new Error("SESSION_CHANGED");
    return operation();
  }
}

export const inboxService = {
  orders(scope: InboxScope, threadId: string, cursor: string | undefined, signal: AbortSignal) {
    return read(
      scope,
      signal,
      async () =>
        conversationOrdersResponse.parse(
          (
            await apiClient.get(
              `/businesses/${scope.businessId}/whatsapp/conversations/${threadId}/orders`,
              { params: { cursor }, signal },
            )
          ).data,
        ).data,
    );
  },
  media(
    scope: InboxScope,
    threadId: string,
    messageId: string,
    signal: AbortSignal,
  ): Promise<Blob> {
    return read(
      scope,
      signal,
      async () =>
        (
          await apiClient.get<Blob>(
            `/businesses/${scope.businessId}/whatsapp/conversations/${threadId}/media/${messageId}`,
            { responseType: "blob", signal },
          )
        ).data,
    );
  },
  reviewProof(
    scope: InboxScope,
    threadId: string,
    orderId: string,
    proofId: string,
    input: ReviewProofInput,
  ) {
    return withAuthenticatedSession(async (session, headers) => {
      if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
        throw new Error("SESSION_CHANGED");
      const response = await apiClient.post(
        `/businesses/${scope.businessId}/whatsapp/conversations/${threadId}/orders/${orderId}/proofs/${proofId}/review`,
        input,
        { headers },
      );
      return conversationOrderResponse.parse(response.data).data;
    });
  },
  setControl(scope: InboxScope, threadId: string, mode: "AI" | "HUMAN", version: number) {
    return withAuthenticatedSession(async (session, headers) => {
      if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
        throw new Error("SESSION_CHANGED");
      const response = await apiClient.post(
        `/businesses/${scope.businessId}/whatsapp/conversations/${threadId}/control`,
        { mode, version },
        { headers },
      );
      return controlResponseSchema.parse(response.data).data;
    });
  },
  sendText(scope: InboxScope, threadId: string, key: string, body: string) {
    const input = sendTextSchema.parse({ body });
    return withAuthenticatedSession(async (session, headers) => {
      if (session.user.id !== scope.userId || session.activeBusinessId !== scope.businessId)
        throw new Error("SESSION_CHANGED");
      const response = await apiClient.post(
        `/businesses/${scope.businessId}/whatsapp/conversations/${threadId}/messages`,
        input,
        { headers: { ...headers, "Idempotency-Key": key } },
      );
      return sendAttemptResponseSchema.parse(response.data).data;
    });
  },
  attempt(scope: InboxScope, threadId: string, key: string, signal: AbortSignal) {
    return read(
      scope,
      signal,
      async () =>
        sendAttemptResponseSchema.parse(
          (
            await apiClient.get(
              `/businesses/${scope.businessId}/whatsapp/conversations/${threadId}/send-attempts/${key}`,
              { signal },
            )
          ).data,
        ).data,
    );
  },
  threads(scope: InboxScope, cursor: string | undefined, signal: AbortSignal, search?: string) {
    return read(
      scope,
      signal,
      async () =>
        threadResponseSchema.parse(
          (
            await apiClient.get(`/businesses/${scope.businessId}/whatsapp/conversations`, {
              params: { cursor, search: search || undefined },
              signal,
            })
          ).data,
        ).data,
    );
  },
  messages(scope: InboxScope, threadId: string, cursor: string | undefined, signal: AbortSignal) {
    return read(
      scope,
      signal,
      async () =>
        messageResponseSchema.parse(
          (
            await apiClient.get(
              `/businesses/${scope.businessId}/whatsapp/conversations/${threadId}/messages`,
              { params: { cursor }, signal },
            )
          ).data,
        ).data,
    );
  },
};
