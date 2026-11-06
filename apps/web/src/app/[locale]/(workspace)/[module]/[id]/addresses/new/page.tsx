import { Suspense } from "react";
import { ClientAddressRoute } from "@/features/clients/components/client-address-route";
export const instant = false;
export default function NewAddressPage({
  params,
}: PageProps<"/[locale]/[module]/[id]/addresses/new">) {
  return (
    <Suspense
      fallback={
        <div className="min-h-80 animate-pulse rounded-3xl border bg-card" aria-busy="true" />
      }
    >
      <ClientAddressRoute params={params} />
    </Suspense>
  );
}
