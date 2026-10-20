"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import type { Session } from "../schemas/session-schema";
import { resetSessionData } from "../services/reset-session-data";
import { notifySessionChange } from "../services/session-events";
import { sessionQueryKey } from "./use-session";

export function useAuthAccess() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return async (session: Session, destination: "/dashboard" | "/onboarding") => {
    await queryClient.cancelQueries({ queryKey: sessionQueryKey });
    resetSessionData(queryClient);
    queryClient.setQueryData(sessionQueryKey, session);
    notifySessionChange();
    router.replace(destination);
    router.refresh();
  };
}
