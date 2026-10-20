import { ResourceWorkspace } from "./resource-workspace";

export async function ResourceEditRoute({
  params,
}: {
  params: Promise<{ locale: string; module: string; id: string }>;
}) {
  const { module, id } = await params;
  return <ResourceWorkspace module={module} id={id} />;
}
