import { Suspense } from "react";
import { ResourceEditRoute } from "@/features/demo/components/resource-edit-route";

export default function EditResourcePage({ params }: PageProps<"/[locale]/[module]/[id]/edit">) {
  return (
    <Suspense
      fallback={
        <div className="min-h-80 animate-pulse rounded-3xl border bg-card" aria-busy="true" />
      }
    >
      <ResourceEditRoute params={params} />
    </Suspense>
  );
}
