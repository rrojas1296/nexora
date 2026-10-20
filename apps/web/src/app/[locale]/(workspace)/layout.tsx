import { AppShell } from "@/components/layout/app-shell";

// This layout is a UI boundary, not an authentication or authorization guard.
export default function WorkspaceLayout({ children }: LayoutProps<"/[locale]">) {
  return <AppShell>{children}</AppShell>;
}
