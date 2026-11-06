"use client";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useClient } from "@/features/commerce/hooks/use-commerce";
import { CommerceQueryState } from "@/features/commerce/components/commerce-query-state";
import { useClientAddresses } from "../hooks/use-client-addresses";
import { ClientAddressEditor } from "./client-address-editor";
export function ClientAddressScreen({
  clientId,
  addressId,
}: {
  clientId: string;
  addressId?: string;
}) {
  const t = useTranslations("Delivery");
  const router = useRouter();
  const client = useClient(clientId);
  const addresses = useClientAddresses(clientId);
  const valid =
    z.uuid().safeParse(clientId).success && (!addressId || z.uuid().safeParse(addressId).success);
  const address = addresses.data?.find((item) => item.id === addressId);
  if (!valid)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("notFound")}
      </p>
    );
  return (
    <CommerceQueryState
      pending={client.isPending || addresses.isPending}
      error={client.isError || addresses.isError}
      empty={false}
      retry={() => {
        void client.refetch();
        void addresses.refetch();
      }}
    >
      {!client.data?.active || (addressId && !address) ? (
        <p role="alert" className="text-sm text-destructive">
          {t("notFound")}
        </p>
      ) : client.data ? (
        <>
          <p className="mb-5 text-sm font-medium">{client.data.name}</p>
          <ClientAddressEditor
            key={addressId ?? "new"}
            clientId={clientId}
            address={address}
            onClose={() => router.push(`/clients/${clientId}/edit`)}
          />
        </>
      ) : null}
    </CommerceQueryState>
  );
}
