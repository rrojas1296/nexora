"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthAccess } from "@/features/auth/hooks/use-auth-access";
import { sessionQueryKey } from "@/features/auth/hooks/use-session";
import { authService } from "@/features/auth/services/auth-service";
import { notifySessionChange } from "@/features/auth/services/session-events";

export function useSwitchBusiness() {
  const acceptSession = useAuthAccess();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (businessId: string) => {
      const session = await authService.switchBusiness(businessId);
      await acceptSession(session, "/dashboard");
    },
    retry: false,
    onError: async () => {
      // An uncertain response can have changed cookies. Reconcile; never replay.
      notifySessionChange();
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
}
