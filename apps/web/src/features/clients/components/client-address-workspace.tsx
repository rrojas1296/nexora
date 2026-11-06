import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CommerceScope } from "@/features/commerce/components/commerce-scope";
import { ClientAddressScreen } from "./client-address-screen";
export async function ClientAddressWorkspace({
  clientId,
  addressId,
}: {
  clientId: string;
  addressId?: string;
}) {
  const t = await getTranslations("Delivery");
  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <Link
          href={`/clients/${clientId}/edit`}
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          {t("backClient")}
        </Link>
        <h1 className="text-3xl font-normal tracking-tight sm:text-4xl">
          {t(addressId ? "editAddress" : "addAddress")}
        </h1>
      </header>
      <section className="max-w-5xl rounded-3xl border bg-card p-5 sm:p-7">
        <CommerceScope>
          <ClientAddressScreen clientId={clientId} addressId={addressId} />
        </CommerceScope>
      </section>
    </div>
  );
}
