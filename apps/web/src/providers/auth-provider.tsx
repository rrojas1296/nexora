"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SessionReconciliationContext } from "@/features/auth/hooks/session-reconciliation-context";
import { useQueryClient } from "@tanstack/react-query";
import { sessionQueryKey, useSession } from "@/features/auth/hooks/use-session";
import { resetSessionData } from "@/features/auth/services/reset-session-data";
import { sessionChannelName } from "@/features/auth/services/session-events";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  useSession({ poll: true });
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    const recheck = () => {
      if (document.visibilityState === "visible") {
        setReconciling(true);
        queryClient
          .invalidateQueries({ queryKey: sessionQueryKey }, { cancelRefetch: false })
          .finally(() => setReconciling(false));
      }
    };
    const changed = () => {
      // Hide the old identity immediately, even while this tab is backgrounded.
      resetSessionData(queryClient);
      queryClient.setQueryData(sessionQueryKey, null);
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    };
    const channel =
      typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(sessionChannelName);
    if (channel)
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (event.data === "changed") changed();
      };
    window.addEventListener("online", recheck);
    return () => {
      channel?.close();
      window.removeEventListener("online", recheck);
    };
  }, [queryClient]);

  return (
    <SessionReconciliationContext value={reconciling}>{children}</SessionReconciliationContext>
  );
}
