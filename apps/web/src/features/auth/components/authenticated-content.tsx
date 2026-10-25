import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { readServerSession } from "../services/server-session";
import { SessionGate } from "./session-gate";
import { SessionRecovery } from "./session-recovery";

export async function AuthenticatedContent({
  children,
  allowWithoutBusiness = false,
}: {
  children: ReactNode;
  allowWithoutBusiness?: boolean;
}) {
  const status = await readServerSession();
  if (status === "onboarding" && !allowWithoutBusiness)
    redirect({ href: "/onboarding", locale: await getLocale() });
  if (status !== "authenticated" && status !== "onboarding")
    return <SessionRecovery unavailable={status === "unavailable"} />;
  return <SessionGate>{children}</SessionGate>;
}
