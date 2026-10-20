"use client";

import { useWorkspace } from "@/features/demo/hooks/use-workspace";
import { QueryState } from "@/features/demo/components/query-state";
import { AgentForm } from "./agent-form";

export function AgentScreen() {
  const query = useWorkspace();
  return (
    <QueryState
      pending={query.isPending}
      error={query.isError}
      retry={() => {
        void query.refetch();
      }}
    >
      {query.data ? <AgentForm agent={query.data.agent} /> : null}
    </QueryState>
  );
}
