"use client";

import { create } from "zustand";
import type { DemoScenario } from "../types/workspace";

type State = {
  scenario: DemoScenario;
  revision: number;
  setScenario: (scenario: DemoScenario) => void;
  bumpRevision: () => void;
  reset: () => void;
};
export const useDemoScenarioStore = create<State>((set) => ({
  scenario: "normal",
  revision: 0,
  setScenario: (scenario) => set({ scenario }),
  bumpRevision: () => set((state) => ({ revision: state.revision + 1 })),
  reset: () => set((state) => ({ scenario: "normal", revision: state.revision + 1 })),
}));
