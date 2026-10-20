"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "../schemas/session-schema";
import { resetSessionData } from "../services/reset-session-data";
import { authService } from "../services/auth-service";

export const sessionQueryKey = ["auth", "session"] as const;

export function useSession({
  poll = false,
  reconcileOnMount = false,
}: {
  poll?: boolean;
  reconcileOnMount?: boolean;
} = {}) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async () => {
      const session = await authService.current();
      const previous = queryClient.getQueryData<Session | null>(sessionQueryKey);
      if (
        previous?.user.id !== session?.user.id ||
        previous?.activeBusinessId !== session?.activeBusinessId
      ) {
        resetSessionData(queryClient);
      }
      return session;
    },
    retry: false,
    staleTime: 30_000,
    refetchOnMount: reconcileOnMount ? "always" : true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: poll ? 60_000 : false,
    refetchIntervalInBackground: false,
  });
}
