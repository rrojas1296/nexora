"use client";

import { useState } from "react";
import { Plus, Store as StoreIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/features/demo/hooks/use-workspace";
import { QueryState } from "@/features/demo/components/query-state";
import { ListToolbar } from "@/features/demo/components/list-toolbar";
import { StatusBadge } from "@/features/demo/components/status-badge";
import { Link } from "@/i18n/navigation";

export function StoresScreen() {
  const t = useTranslations("Stores");
  const common = useTranslations("Demo");
  const query = useWorkspace();
  const [search, setSearch] = useState("");
  const stores = (query.data?.stores ?? []).filter((store) =>
    `${store.name} ${store.address}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <p className="text-xs leading-6 text-muted-foreground">{t("hint")}</p>
      <ListToolbar search={search} onSearch={setSearch} count={stores.length}>
        <Button asChild>
          <Link href="/stores/new">
            <Plus className="size-4" aria-hidden="true" />
            {t("create")}
          </Link>
        </Button>
      </ListToolbar>
      <QueryState
        pending={query.isPending}
        error={query.isError}
        empty={!stores.length}
        retry={() => {
          void query.refetch();
        }}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {stores.map((store) => (
            <article key={store.id} className="rounded-3xl border bg-card p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary">
                  <StoreIcon className="size-4" aria-hidden="true" />
                </span>
                <StatusBadge status={store.active ? "active" : "inactive"} />
              </div>
              <h2 className="mt-5 text-lg">{store.name}</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{store.address}</p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">{t("currency")}</dt>
                  <dd className="mt-1">{store.currency}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("timezone")}</dt>
                  <dd className="mt-1 break-words">{store.timezone}</dd>
                </div>
              </dl>
              <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
                <p className="text-xs text-muted-foreground">
                  {t("ordersCount", {
                    count:
                      query.data?.orders.filter((order) => order.storeId === store.id).length ?? 0,
                  })}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  aria-label={`${t("edit")}: ${store.name}`}
                >
                  <Link href={`/stores/${store.id}/edit`}>{common("edit")}</Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </QueryState>
    </div>
  );
}
