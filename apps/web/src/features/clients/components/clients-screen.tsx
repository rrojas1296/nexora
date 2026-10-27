"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useClients, useCommerceAccess } from "@/features/commerce/hooks/use-commerce";
import { CommerceKpis } from "@/features/commerce/components/commerce-kpis";
import { CommerceQueryState as QueryState } from "@/features/commerce/components/commerce-query-state";
import { DataTable } from "@/features/demo/components/data-table";
import { ListToolbar } from "@/features/demo/components/list-toolbar";
import { Pagination } from "@/features/demo/components/pagination";
import { Link } from "@/i18n/navigation";
import { ClientDetail } from "./client-detail";
export function ClientsScreen() {
  const t = useTranslations("Clients");
  const common = useTranslations("Demo");
  const c = useTranslations("Commerce");
  const { canWrite } = useCommerceAccess();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useClients({ search, page, pageSize: 10 });
  const summary = query.isError ? undefined : query.data?.summary;
  const clients = query.data?.data ?? [];
  const selected = clients.find((client) => client.id === selectedId);
  return (
    <div className="space-y-5">
      <CommerceKpis
        metrics={[
          { label: "totalClients", value: summary?.total },
          { label: "activeClients", value: summary?.active },
          { label: "vipClients", value: summary?.vip },
        ]}
      />
      <p className="text-xs leading-6 text-muted-foreground">{c("liveClients")}</p>
      <ListToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        count={query.data?.pagination.total ?? 0}
      >
        {canWrite ? (
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="size-4" aria-hidden="true" />
              {t("create")}
            </Link>
          </Button>
        ) : null}
      </ListToolbar>
      <QueryState
        pending={query.isPending}
        error={query.isError}
        empty={!clients.length}
        retry={() => {
          void query.refetch();
        }}
      >
        <DataTable
          caption={t("table")}
          rows={clients}
          columns={[
            { key: "name", label: t("name"), render: (client) => client.name },
            { key: "email", label: t("email"), render: (client) => client.email || "—" },
            { key: "phone", label: t("phone"), render: (client) => client.phone },
            { key: "orders", label: t("orders"), render: (client) => client.ordersCount },
            {
              key: "actions",
              label: common("actions"),
              render: (client) => (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedId(client.id)}
                    aria-label={`${t("history")}: ${client.name}`}
                  >
                    {t("history")}
                  </Button>
                  {canWrite ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        href={`/clients/${client.id}/edit`}
                        aria-label={`${t("edit")}: ${client.name}`}
                      >
                        {common("edit")}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ),
            },
          ]}
        />
      </QueryState>
      {query.data && !query.isError ? (
        <Pagination page={page} pages={query.data.pagination.pages} onPage={setPage} />
      ) : null}
      {selected ? (
        <ClientDetail key={selected.id} client={selected} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}
