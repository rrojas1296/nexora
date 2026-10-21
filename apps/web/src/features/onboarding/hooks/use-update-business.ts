"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sessionQueryKey } from "@/features/auth/hooks/use-session";
import type { Session } from "@/features/auth/schemas/session-schema";
import { businessService } from "../services/business-service";

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: businessService.updateName,
    retry: false,
    onSuccess: async (business, variables) => {
      await queryClient.cancelQueries({ queryKey: sessionQueryKey });
      if (variables.signal.aborted) return;
      queryClient.setQueryData<Session | null>(sessionQueryKey, (session) => {
        if (
          !session ||
          session.user.id !== variables.userId ||
          session.activeBusinessId !== business.id
        )
          return session;
        return {
          ...session,
          memberships: session.memberships.map((membership) =>
            membership.businessId === business.id ? { ...membership, business } : membership,
          ),
        };
      });
      void queryClient.invalidateQueries({ queryKey: sessionQueryKey });
    },
  });
}
