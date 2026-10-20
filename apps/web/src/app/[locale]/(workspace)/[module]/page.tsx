import { notFound } from "next/navigation";
import { validateLocale } from "@/i18n/validate-locale";
import { setRequestLocale } from "next-intl/server";
import { navigationGroups } from "@/components/layout/navigation";
import { ModuleWorkspace } from "@/features/workspace/components/module-workspace";

const modules = navigationGroups
  .flatMap((group) => [...group.items])
  .filter((item) => item.key !== "dashboard");

export function generateStaticParams() {
  return modules.map((item) => ({ module: item.key }));
}

export default async function ModulePage({ params }: PageProps<"/[locale]/[module]">) {
  const { locale, module } = await params;
  const selected = modules.find((item) => item.key === module);
  if (!selected) notFound();
  setRequestLocale(validateLocale(locale));
  return <ModuleWorkspace module={selected.key} />;
}
