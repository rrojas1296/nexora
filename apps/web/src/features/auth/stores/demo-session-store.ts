"use client";

import { create } from "zustand";
import type { DemoSession } from "../types/demo-session";

type DemoSessionState = {
  session: DemoSession | null;
  startSession: (session: DemoSession) => void;
  endSession: () => void;
};

// Memory only. Never store passwords or model this as a security boundary.
export const useDemoSessionStore = create<DemoSessionState>((set) => ({
  session: null,
  startSession: (session) => set({ session }),
  endSession: () => set({ session: null }),
}));
