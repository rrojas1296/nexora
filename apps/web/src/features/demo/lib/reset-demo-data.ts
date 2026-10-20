"use client";

import { resetMockWorkspace } from "../services/workspace-service";
import { useDemoScenarioStore } from "../stores/demo-scenario-store";

export function resetDemoData() {
  resetMockWorkspace();
  useDemoScenarioStore.getState().reset();
}
