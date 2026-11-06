"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useCommerceAccess } from "@/features/commerce/hooks/use-commerce";
import { CommerceQueryState } from "@/features/commerce/components/commerce-query-state";
import { useClientAddresses } from "../hooks/use-client-addresses";
export function ClientAddressList({ clientId }: { clientId: string }) {
  const t = useTranslations("Delivery");
  const { canWrite } = useCommerceAccess();
  const query = useClientAddresses(clientId);
  return (
    <section className="mt-7 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{t("addresses")}</h3>
        {canWrite ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/clients/${clientId}/addresses/new`}>{t("addAddress")}</Link>
          </Button>
        ) : null}
      </div>
      <p className="max-w-3xl text-xs leading-6 text-muted-foreground">{t("addressHint")}</p>
      <CommerceQueryState
        pending={query.isPending}
        error={query.isError}
        empty={query.data?.length === 0}
        retry={() => {
          void query.refetch();
        }}
      >
        <ul className="divide-y rounded-2xl border px-4">
          {query.data?.map((address) => (
            <li key={address.id} className="space-y-2 py-4 text-xs leading-6">
              <div className="flex flex-wrap justify-between gap-3">
                <span className="font-medium">
                  {address.label}
                  {address.isDefault ? ` · ${t("default")}` : ""}
                </span>
                {canWrite ? (
                  <Link
                    className="underline underline-offset-4"
                    href={`/clients/${clientId}/addresses/${address.id}/edit`}
                  >
                    {t("editAddress")}
                  </Link>
                ) : null}
              </div>
              <p className="whitespace-pre-wrap break-words">{address.address}</p>
              {address.reference ? (
                <p className="whitespace-pre-wrap break-words text-muted-foreground">
                  {address.reference}
                </p>
              ) : null}
              <p className="break-words">
                {[address.district, address.city, address.country].filter(Boolean).join(", ")}
              </p>
              {address.latitude !== null ? (
                <p dir="ltr">
                  {address.latitude}, {address.longitude}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </CommerceQueryState>
    </section>
  );
}
