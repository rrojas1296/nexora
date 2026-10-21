"use client";

import { useTranslations } from "next-intl";
import { useAgent, useAgentAccess } from "../hooks/use-agent";
import { agentErrorKey } from "../services/agent-error";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/features/demo/components/query-state";
import { AgentForm } from "./agent-form";

export function AgentScreen() {
  const t = useTranslations("Agent");
  const query = useAgent();
  const { scope, canWrite } = useAgentAccess();
  return (
    <QueryState
      pending={query.isPending}
      error={query.isError && query.data === undefined}
      errorMessage={query.error ? t(`errors.${agentErrorKey(query.error)}`) : undefined}
      retry={() => {
        void query.refetch();
      }}
    >
      {query.data !== undefined && scope ? (
        <div className="space-y-4">
          {query.isError ? (
            <div className="rounded-xl border border-destructive/30 p-4">
              <p role="alert" className="text-xs text-destructive">
                {t("refreshError")}
              </p>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => {
                  void query.refetch();
                }}
              >
                {t("retry")}
              </Button>
            </div>
          ) : null}
          <output className="block text-xs leading-6 text-muted-foreground" aria-live="polite">
            123
            {t(!canWrite ? "readOnly" : query.data === null ? "unconfigured" : "persistedHint")}
          </output>
          <AgentForm key={`${scope.userId}-${scope.businessId}`} agent={query.data} />
        </div>
      ) : null}
    </QueryState>
  );
}
