import type { ReactNode } from "react";
import { readServerSession } from "../services/server-session";
import { SessionGate } from "./session-gate";
import { SessionRecovery } from "./session-recovery";

export async function AuthenticatedContent({ children }: { children: ReactNode }) {
  const status = await readServerSession();
  if (status !== "authenticated") return <SessionRecovery unavailable={status === "unavailable"} />;
  return <SessionGate>{children}</SessionGate>;
}
