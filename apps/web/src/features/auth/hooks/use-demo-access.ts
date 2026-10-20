"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/navigation";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding-store";
import { useDemoSessionStore } from "../stores/demo-session-store";
import { resetDemoData } from "@/features/demo/lib/reset-demo-data";
import type { DemoSession } from "../types/demo-session";

export function useDemoAccess() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return (session: DemoSession) => {
    resetDemoData();
    queryClient.clear();
    useOnboardingStore.getState().reset();
    useDemoSessionStore.getState().startSession(session);
    router.push("/onboarding");
  };
}
