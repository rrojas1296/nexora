"use client";

import type { QueryClient } from "@tanstack/react-query";
import { resetDemoData } from "@/features/demo/lib/reset-demo-data";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding-store";

export function resetSessionData(queryClient: QueryClient) {
  const filters = {
    predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== "auth",
  };
  void queryClient.cancelQueries(filters);
  queryClient.removeQueries(filters);
  resetDemoData();
  useOnboardingStore.getState().reset();
}
