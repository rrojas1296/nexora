"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InboxScope } from "../schemas/inbox-schema";
import { inboxService } from "../services/inbox-service";

export function useConversationControl(scope: InboxScope, threadId: string) {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: ({ mode, version }: { mode: "AI" | "HUMAN"; version: number }) =>
      inboxService.setControl(scope, threadId, mode, version),
    onSettled: async () => {
      // Reconcile even after an uncertain response; never replay the mutation.
      await client.invalidateQueries({
        queryKey: ["whatsapp-inbox", scope.userId, scope.businessId],
      });
    },
  });
}
