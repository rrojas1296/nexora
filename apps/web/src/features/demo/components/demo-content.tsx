"use client";

import type { ReactNode } from "react";
import { useDemoScenarioStore } from "../stores/demo-scenario-store";

export function DemoContent({ children }: { children: ReactNode }) {
  const scenario = useDemoScenarioStore((state) => state.scenario);
  const revision = useDemoScenarioStore((state) => state.revision);
  return <div key={`${scenario}-${revision}`}>{children}</div>;
}
