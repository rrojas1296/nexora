import { notFound } from "next/navigation";
import { navigationGroups } from "@/components/layout/navigation";
import { ModuleWorkspace } from "@/features/workspace/components/module-workspace";

// Auth may omit this segment; do not validate navigation through the session gate.
export const instant = false;

const modules = navigationGroups
  .flatMap((group) => [...group.items])
  .filter((item) => item.key !== "dashboard");

export function generateStaticParams() {
  return modules.map((item) => ({ module: item.key }));
}

export default async function ModulePage({ params }: PageProps<"/[locale]/[module]">) {
  const { module } = await params;
  const selected = modules.find((item) => item.key === module);
  if (!selected) notFound();
  return <ModuleWorkspace module={selected.key} />;
}
