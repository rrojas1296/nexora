"use client";

import { useWorkspace } from "@/features/demo/hooks/use-workspace";
import { QueryState } from "@/features/demo/components/query-state";
import { SettingsForm } from "./settings-form";

export function SettingsScreen() {
  const query = useWorkspace();
  return (
    <QueryState
      pending={query.isPending}
      error={query.isError}
      retry={() => {
        void query.refetch();
      }}
    >
      {query.data ? <SettingsForm settings={query.data.settings} /> : null}
    </QueryState>
  );
}
