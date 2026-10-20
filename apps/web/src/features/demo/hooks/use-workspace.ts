"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "../services/workspace-service";
import { useDemoScenarioStore } from "../stores/demo-scenario-store";
import type { WorkspaceCommand } from "../schemas/command-schema";

export const workspaceQueryKey = ["demo-workspace"] as const;
export function useWorkspace() {
  const scenario = useDemoScenarioStore((state) => state.scenario);
  return useQuery({
    queryKey: [...workspaceQueryKey, scenario],
    queryFn: ({ signal }) => workspaceService.read(scenario, signal),
    retry: false,
  });
}
export function useWorkspaceMutation() {
  const client = useQueryClient();
  const scenario = useDemoScenarioStore((state) => state.scenario);
  return useMutation({
    mutationKey: workspaceQueryKey,
    mutationFn: (command: WorkspaceCommand) => workspaceService.execute(command, scenario),
    onSuccess: () => client.invalidateQueries({ queryKey: workspaceQueryKey }),
  });
}
