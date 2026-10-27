"use client";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ClientEditor } from "@/features/clients/components/client-editor";
import { OrderEditor } from "@/features/orders/components/order-editor";
import { useClient, useOrder, useCommerceAccess } from "@/features/commerce/hooks/use-commerce";
import { CommerceQueryState as QueryState } from "@/features/commerce/components/commerce-query-state";
export function ResourceEditorScreen({
  resource,
  id,
}: {
  resource: "clients" | "orders";
  id?: string;
}) {
  const t = useTranslations("Commerce");
  const router = useRouter();
  const { canWrite } = useCommerceAccess();
  const client = useClient(resource === "clients" ? id : undefined);
  const order = useOrder(resource === "orders" ? id : undefined);
  const query = resource === "clients" ? client : order;
  const onClose = () => router.push(`/${resource}`);
  if (id && !z.uuid().safeParse(id).success) return <p role="alert">{t("notFound")}</p>;
  if (!id && !canWrite) return <p role="alert">{t("forbidden")}</p>;
  return (
    <QueryState
      pending={!!id && query.isPending}
      error={!!id && query.isError}
      retry={() => {
        void query.refetch();
      }}
    >
      <div className="grid items-start gap-6 xl:grid-cols-4">
        <section className="min-w-0 rounded-3xl border bg-card p-5 sm:p-7 xl:col-span-3">
          {resource === "clients" && (!id || client.data) ? (
            <ClientEditor key={id ?? "new"} client={client.data} onClose={onClose} />
          ) : null}
          {resource === "orders" && (!id || order.data) ? (
            <OrderEditor key={id ?? "new"} order={order.data} onClose={onClose} />
          ) : null}
        </section>
        <aside className="space-y-3 rounded-3xl border bg-card p-5">
          <h2 className="text-sm font-medium">{t("persistentTitle")}</h2>
          <p className="text-xs leading-6 text-muted-foreground">
            {t(resource === "clients" ? "clientHint" : "draftHint")}
          </p>
          <p className="border-t pt-4 text-xs leading-6 text-muted-foreground">{t("uncertain")}</p>
        </aside>
      </div>
    </QueryState>
  );
}
