import { setRequestLocale } from "next-intl/server";
import { validateLocale } from "@/i18n/validate-locale";
import { resourceModules } from "@/features/demo/lib/resources";
import { ResourceWorkspace } from "@/features/demo/components/resource-workspace";

export function generateStaticParams() {
  return resourceModules.map((module) => ({ module }));
}
export default async function CreateResourcePage({ params }: PageProps<"/[locale]/[module]/new">) {
  const { locale, module } = await params;
  setRequestLocale(validateLocale(locale));
  return <ResourceWorkspace module={module} />;
}
