"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InboxScope } from "../schemas/inbox-schema";
import type { ReviewProofInput } from "../schemas/commerce-schema";
import { inboxService } from "../services/inbox-service";

export function useConversationOrders(scope: InboxScope, threadId: string, cursor?: string) {
  return useQuery({
    queryKey: ["whatsapp-inbox", scope.userId, scope.businessId, "orders", threadId, cursor],
    queryFn: ({ signal }) => inboxService.orders(scope, threadId, cursor, signal),
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => (cursor || query.state.status === "error" ? false : 10_000),
  });
}

export function useProofReview(scope: InboxScope, threadId: string) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({
      orderId,
      proofId,
      input,
    }: {
      orderId: string;
      proofId: string;
      input: ReviewProofInput;
    }) => inboxService.reviewProof(scope, threadId, orderId, proofId, input),
    onSettled: async () => {
      await client.invalidateQueries({
        queryKey: ["whatsapp-inbox", scope.userId, scope.businessId, "orders", threadId],
      });
    },
  });
}
