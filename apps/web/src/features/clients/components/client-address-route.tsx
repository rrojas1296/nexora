import { notFound } from "next/navigation";
import { ClientAddressWorkspace } from "./client-address-workspace";
export async function ClientAddressRoute({
  params,
}: {
  params: Promise<{ module: string; id: string; addressId?: string }>;
}) {
  const { module, id, addressId } = await params;
  if (module !== "clients") notFound();
  return <ClientAddressWorkspace clientId={id} addressId={addressId} />;
}
