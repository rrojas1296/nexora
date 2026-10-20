"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "../hooks/use-workspace";
import { useDemoScenarioStore } from "../stores/demo-scenario-store";
import type { ResourceModule } from "../lib/resources";
import { QueryState } from "./query-state";

const ProductEditor = dynamic(() =>
  import("@/features/products/components/product-editor").then((module) => module.ProductEditor),
);
const ClientEditor = dynamic(() =>
  import("@/features/clients/components/client-editor").then((module) => module.ClientEditor),
);
const StoreEditor = dynamic(() =>
  import("@/features/stores/components/store-editor").then((module) => module.StoreEditor),
);
const OrderEditor = dynamic(() =>
  import("@/features/orders/components/order-editor").then((module) => module.OrderEditor),
);

export function ResourceEditorScreen({ resource, id }: { resource: ResourceModule; id?: string }) {
  const t = useTranslations("ResourceEditor");
  const common = useTranslations("Demo");
  const query = useWorkspace();
  const router = useRouter();
  const readOnly = useDemoScenarioStore((state) => state.scenario !== "normal");
  const workspace = query.data;
  const onClose = () => router.push(`/${resource}`);
  const missing = id && workspace && !workspace[resource].some((row) => row.id === id);
  return (
    <QueryState
      pending={query.isPending}
      error={query.isError}
      retry={() => {
        void query.refetch();
      }}
    >
      {workspace ? (
        readOnly || missing ? (
          <section className="rounded-3xl border bg-card p-6">
            <h2 className="text-lg">{t(missing ? "notFound" : "readOnly")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {missing ? common("errors.missing") : common("emptyReadOnly")}
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href={`/${resource}`}>{t("back")}</Link>
            </Button>
          </section>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-4">
            <section className="min-w-0 rounded-3xl border bg-card p-5 sm:p-7 xl:col-span-3">
              {resource === "products" ? (
                <ProductEditor
                  key={id ?? "new"}
                  product={workspace.products.find((row) => row.id === id)}
                  onClose={onClose}
                />
              ) : null}
              {resource === "clients" ? (
                <ClientEditor
                  key={id ?? "new"}
                  client={workspace.clients.find((row) => row.id === id)}
                  onClose={onClose}
                />
              ) : null}
              {resource === "stores" ? (
                <StoreEditor
                  key={id ?? "new"}
                  store={workspace.stores.find((row) => row.id === id)}
                  onClose={onClose}
                />
              ) : null}
              {resource === "orders" ? (
                <OrderEditor
                  key={id ?? "new"}
                  order={workspace.orders.find((row) => row.id === id)}
                  workspace={workspace}
                  onClose={onClose}
                />
              ) : null}
            </section>
            <aside className="rounded-3xl border bg-card p-5">
              <h2 className="text-sm font-medium">{t("draftTitle")}</h2>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">{t("draftHint")}</p>
              <p className="mt-4 border-t pt-4 text-xs leading-6 text-muted-foreground">
                {t("simulation")}
              </p>
            </aside>
          </div>
        )
      ) : null}
    </QueryState>
  );
}
