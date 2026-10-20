import { resourceModules } from "@/features/demo/lib/resources";
import { ResourceWorkspace } from "@/features/demo/components/resource-workspace";

export function generateStaticParams() {
  return resourceModules.map((module) => ({ module }));
}
export default async function CreateResourcePage({ params }: PageProps<"/[locale]/[module]/new">) {
  const { module } = await params;
  return <ResourceWorkspace module={module} />;
}
