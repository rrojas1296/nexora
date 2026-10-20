import { setRequestLocale } from "next-intl/server";
import { validateLocale } from "@/i18n/validate-locale";
import { ModuleWorkspace } from "@/features/workspace/components/module-workspace";

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(validateLocale(locale));
  return <ModuleWorkspace module="dashboard" />;
}
