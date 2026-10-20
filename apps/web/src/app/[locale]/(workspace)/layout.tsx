import { setRequestLocale } from "next-intl/server";
import { validateLocale } from "@/i18n/validate-locale";
import { AppShell } from "@/components/layout/app-shell";

// This layout is a UI boundary, not an authentication or authorization guard.
export default async function WorkspaceLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(validateLocale(locale));
  return <AppShell>{children}</AppShell>;
}
