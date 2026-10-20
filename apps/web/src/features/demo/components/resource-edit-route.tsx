import { setRequestLocale } from "next-intl/server";
import { validateLocale } from "@/i18n/validate-locale";
import { ResourceWorkspace } from "./resource-workspace";

export async function ResourceEditRoute({
  params,
}: {
  params: Promise<{ locale: string; module: string; id: string }>;
}) {
  const { locale, module, id } = await params;
  setRequestLocale(validateLocale(locale));
  return <ResourceWorkspace module={module} id={id} />;
}
