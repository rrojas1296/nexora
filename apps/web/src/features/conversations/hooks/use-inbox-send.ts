"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InboxScope, InboxSendAttempt } from "../schemas/inbox-schema";
import { inboxService } from "../services/inbox-service";

export function useInboxSend(scope: InboxScope, threadId: string) {
  const client = useQueryClient();
  const lock = useRef(false);
  const [tracked, setTracked] = useState<{ key: string; result: InboxSendAttempt | null } | null>(
    null,
  );
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["whatsapp-inbox", scope.userId, scope.businessId] });
  const send = useMutation({
    mutationFn: ({ key, body }: { key: string; body: string }) =>
      inboxService.sendText(scope, threadId, key, body),
    retry: false,
    gcTime: 0,
    onSuccess: (result, variables) => setTracked({ key: variables.key, result }),
    onSettled: () => {
      void refresh();
    },
  });
  const reconcile = useMutation({
    mutationFn: (key: string) =>
      inboxService.attempt(scope, threadId, key, new AbortController().signal),
    retry: false,
    gcTime: 0,
    onSuccess: (result, key) => setTracked({ key, result }),
    onSettled: () => {
      void refresh();
    },
  });
  return {
    tracked,
    error: send.error,
    reconcileError: reconcile.error,
    isPending: send.isPending || reconcile.isPending,
    async submit(body: string) {
      if (lock.current || tracked) return;
      lock.current = true;
      const key = crypto.randomUUID();
      setTracked({ key, result: null });
      try {
        await send.mutateAsync({ key, body });
      } catch {
        /* Retain the key. Never replay an uncertain mutation. */
      } finally {
        lock.current = false;
      }
    },
    checkStatus() {
      if (tracked && !send.isPending && !reconcile.isPending) reconcile.mutate(tracked.key);
    },
    newMessage() {
      if (lock.current || send.isPending || reconcile.isPending) return;
      setTracked(null);
      send.reset();
      reconcile.reset();
    },
  };
}
