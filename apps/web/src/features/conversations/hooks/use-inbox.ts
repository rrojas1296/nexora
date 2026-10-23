"use client";

import { useQuery } from "@tanstack/react-query";
import type { InboxScope } from "../schemas/inbox-schema";
import { inboxService } from "../services/inbox-service";

const options = {
  retry: false,
  gcTime: 0,
  refetchOnWindowFocus: true,
  refetchIntervalInBackground: false,
} as const;

export function useInboxThreads(scope: InboxScope, cursor?: string) {
  return useQuery({
    ...options,
    queryKey: ["whatsapp-inbox", scope.userId, scope.businessId, "threads", cursor],
    queryFn: ({ signal }) => inboxService.threads(scope, cursor, signal),
    refetchInterval: (query) => (cursor || query.state.status === "error" ? false : 10_000),
  });
}

export function useInboxMessages(scope: InboxScope, threadId: string, cursor?: string) {
  return useQuery({
    ...options,
    queryKey: ["whatsapp-inbox", scope.userId, scope.businessId, "messages", threadId, cursor],
    queryFn: ({ signal }) => inboxService.messages(scope, threadId, cursor, signal),
    refetchInterval: (query) => (cursor || query.state.status === "error" ? false : 10_000),
  });
}
