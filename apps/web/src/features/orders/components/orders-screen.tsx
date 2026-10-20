"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ResourceKpis } from "@/features/demo/components/resource-kpis";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { useWorkspace } from "@/features/demo/hooks/use-workspace";
import { usePagedRows } from "@/features/demo/hooks/use-paged-rows";
import { orderStatuses } from "@/features/demo/schemas/workspace-schema";
import { orderTotal } from "@/features/demo/lib/metrics";
import { QueryState } from "@/features/demo/components/query-state";
import { DataTable } from "@/features/demo/components/data-table";
import { ListToolbar } from "@/features/demo/components/list-toolbar";
import { Pagination } from "@/features/demo/components/pagination";
import { StatusBadge } from "@/features/demo/components/status-badge";
import { OrderDetail } from "./order-detail";

export function OrdersScreen() {
  const t = useTranslations("Orders");
  const common = useTranslations("Demo");
  const format = useFormatter();
  const query = useWorkspace();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [store, setStore] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const clients = new Map(query.data?.clients.map((client) => [client.id, client.name]));
  const orders = (query.data?.orders ?? [])
    .filter(
      (order) =>
        `${order.id} ${clients.get(order.clientId) ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (status === "all" || order.status === status) &&
        (store === "all" || order.storeId === store),
    )
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  const paging = usePagedRows(orders);
  const selected = query.data?.orders.find((order) => order.id === selectedId);
  return (
    <div className="space-y-5">
      <ResourceKpis resource="orders" workspace={query.isError ? undefined : query.data} />
      <p className="text-xs leading-6 text-muted-foreground">{t("hint")}</p>
      <ListToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          paging.setPage(1);
        }}
        count={orders.length}
      >
        <label className="space-y-2 text-xs">
          <span className="block">{common("statusLabel")}</span>
          <SelectField
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              paging.setPage(1);
            }}
            options={[
              { value: "all", label: common("all") },
              ...orderStatuses.map((value) => ({ value, label: common(`status.${value}`) })),
            ]}
          />
        </label>
        <label className="space-y-2 text-xs">
          <span className="block">{t("store")}</span>
          <SelectField
            value={store}
            onValueChange={(value) => {
              setStore(value);
              paging.setPage(1);
            }}
            options={[
              { value: "all", label: common("all") },
              ...(query.data?.stores ?? []).map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
        </label>
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="size-4" aria-hidden="true" />
            {t("create")}
          </Link>
        </Button>
      </ListToolbar>
      <QueryState
        pending={query.isPending}
        error={query.isError}
        empty={!orders.length}
        retry={() => {
          void query.refetch();
        }}
      >
        <DataTable
          caption={t("table")}
          rows={paging.rows}
          columns={[
            {
              key: "id",
              label: t("order"),
              render: (order) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedId(order.id)}
                  aria-label={`${t("detail")}: ${order.id}`}
                >
                  {order.id}
                </Button>
              ),
            },
            {
              key: "client",
              label: t("client"),
              render: (order) => clients.get(order.clientId) ?? "—",
            },
            {
              key: "date",
              label: t("date"),
              render: (order) =>
                format.dateTime(new Date(order.createdAt), {
                  dateStyle: "medium",
                  timeZone: "UTC",
                }),
            },
            {
              key: "total",
              label: t("total"),
              render: (order) =>
                format.number(orderTotal(order), { style: "currency", currency: order.currency }),
            },
            {
              key: "status",
              label: common("statusLabel"),
              render: (order) => <StatusBadge status={order.status} />,
            },
            {
              key: "actions",
              label: common("actions"),
              render: (order) => (
                <Button asChild variant="ghost" size="sm">
                  <Link
                    href={`/orders/${order.id}/edit`}
                    aria-label={`${common("edit")}: ${order.id}`}
                  >
                    {common("edit")}
                  </Link>
                </Button>
              ),
            },
          ]}
        />
        <Pagination page={paging.page} pages={paging.pages} onPage={paging.setPage} />
      </QueryState>
      {selected && query.data ? (
        <OrderDetail order={selected} workspace={query.data} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}
