"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession, sessionQueryKey } from "@/features/auth/hooks/use-session";
import type { Session } from "@/features/auth/schemas/session-schema";
import type { AgentInput, AgentScope } from "../schemas/agent-schema";
import { agentService } from "../services/agent-service";

export function useAgentAccess() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const scope: AgentScope | null = session?.activeBusinessId
    ? { userId: session.user.id, businessId: session.activeBusinessId }
    : null;
  const role = session?.memberships.find(
    (membership) => membership.businessId === scope?.businessId,
  )?.role;
  return {
    scope,
    canWrite: role === "OWNER" || role === "ADMIN",
    isCurrent: () => {
      const current = queryClient.getQueryData<Session | null>(sessionQueryKey);
      return (
        !!scope &&
        current?.user.id === scope.userId &&
        current.activeBusinessId === scope.businessId
      );
    },
  };
}

function agentKey(scope: AgentScope | null) {
  return ["agent-configuration", scope?.userId, scope?.businessId] as const;
}

export function useAgent() {
  const { scope } = useAgentAccess();
  return useQuery({
    queryKey: agentKey(scope),
    queryFn: ({ signal }) => {
      if (!scope) throw new Error("AUTHENTICATED_SESSION_REQUIRED");
      return agentService.get(scope, signal);
    },
    enabled: !!scope,
    retry: false,
  });
}

export function useAgentMutation() {
  const { scope, canWrite, isCurrent } = useAgentAccess();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [...agentKey(scope), "write"],
    mutationFn: (input: AgentInput) => {
      if (!scope || !canWrite) throw new Error("AGENT_FORBIDDEN");
      return agentService.save(scope, input);
    },
    retry: false,
    onSuccess: (saved) => {
      if (isCurrent()) queryClient.setQueryData(agentKey(scope), saved);
    },
    onSettled: async () => {
      // A lost response may have committed. Reconcile reads, never retry writes.
      if (!isCurrent()) return;
      const queryKey = agentKey(scope);
      await queryClient.cancelQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
