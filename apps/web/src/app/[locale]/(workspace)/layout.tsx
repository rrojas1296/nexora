import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthenticatedContent } from "@/features/auth/components/authenticated-content";
import { SessionStatus } from "@/features/auth/components/session-status";
export default function WorkspaceLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <Suspense fallback={<SessionStatus />}>
      <AuthenticatedContent>
        <AppShell>{children}</AppShell>
      </AuthenticatedContent>
    </Suspense>
  );
}
