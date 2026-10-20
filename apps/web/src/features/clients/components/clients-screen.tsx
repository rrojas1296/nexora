"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/features/demo/hooks/use-workspace";
import { usePagedRows } from "@/features/demo/hooks/use-paged-rows";
import { QueryState } from "@/features/demo/components/query-state";
import { DataTable } from "@/features/demo/components/data-table";
import { ListToolbar } from "@/features/demo/components/list-toolbar";
import { Pagination } from "@/features/demo/components/pagination";
import { Link } from "@/i18n/navigation";
import { ResourceKpis } from "@/features/demo/components/resource-kpis";
import { ClientDetail } from "./client-detail";

export function ClientsScreen() {
  const t = useTranslations("Clients");
  const common = useTranslations("Demo");
  const query = useWorkspace();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const clients = (query.data?.clients ?? []).filter((client) =>
    `${client.name} ${client.email} ${client.phone}`.toLowerCase().includes(search.toLowerCase()),
  );
  const paging = usePagedRows(clients);
  const selected = query.data?.clients.find((client) => client.id === selectedId);
  return (
    <div className="space-y-5">
      <ResourceKpis resource="clients" workspace={query.isError ? undefined : query.data} />
      <ListToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          paging.setPage(1);
        }}
        count={clients.length}
      >
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="size-4" aria-hidden="true" />
            {t("create")}
          </Link>
        </Button>
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
          rows={paging.rows}
          columns={[
            { key: "name", label: t("name"), render: (client) => client.name },
            { key: "email", label: t("email"), render: (client) => client.email },
            { key: "phone", label: t("phone"), render: (client) => client.phone },
            {
              key: "orders",
              label: t("orders"),
              render: (client) =>
                query.data?.orders.filter((order) => order.clientId === client.id).length ?? 0,
            },
            {
              key: "actions",
              label: common("actions"),
              render: (client) => (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${t("history")}: ${client.name}`}
                    onClick={() => setSelectedId(client.id)}
                  >
                    {t("history")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`${t("edit")}: ${client.name}`}
                    asChild
                  >
                    <Link href={`/clients/${client.id}/edit`}>{common("edit")}</Link>
                  </Button>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={paging.page} pages={paging.pages} onPage={paging.setPage} />
      </QueryState>
      {selected && query.data ? (
        <ClientDetail
          client={selected}
          workspace={query.data}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}
