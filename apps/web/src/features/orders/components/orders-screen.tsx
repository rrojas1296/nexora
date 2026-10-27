"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { useOrders, useCommerceAccess } from "@/features/commerce/hooks/use-commerce";
import { CommerceKpis } from "@/features/commerce/components/commerce-kpis";
import { CommerceQueryState as QueryState } from "@/features/commerce/components/commerce-query-state";
import { DataTable } from "@/features/demo/components/data-table";
import { ListToolbar } from "@/features/demo/components/list-toolbar";
import { Pagination } from "@/features/demo/components/pagination";
import { orderStatuses } from "../schemas/order-schema";
import { OrderDetail } from "./order-detail";
export function OrdersScreen() {
  const t = useTranslations("Orders");
  const common = useTranslations("Demo");
  const c = useTranslations("Commerce");
  const format = useFormatter();
  const { canWrite } = useCommerceAccess();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useOrders({ search, page, pageSize: 10, ...(status === "all" ? {} : { status }) });
  const orders = query.data?.data ?? [];
  const summary = query.isError ? undefined : query.data?.summary;
  const selected = orders.find((order) => order.id === selectedId);
  return (
    <div className="space-y-5">
      <CommerceKpis
        metrics={[
          { label: "totalOrders", value: summary?.total },
          { label: "draftOrders", value: summary?.draft },
          { label: "pendingOrders", value: summary?.pending },
        ]}
      />
      <p className="text-xs leading-6 text-muted-foreground">{c("liveOrders")}</p>
      <ListToolbar
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        count={query.data?.pagination.total ?? 0}
      >
        <label className="space-y-2 text-xs">
          <span className="block">{common("statusLabel")}</span>
          <SelectField
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: common("all") },
              ...orderStatuses.map((value) => ({ value, label: c(`statuses.${value}`) })),
            ]}
          />
        </label>
        {canWrite ? (
          <Button asChild>
            <Link href="/orders/new">
              <Plus className="size-4" aria-hidden="true" />
              {t("create")}
            </Link>
          </Button>
        ) : null}
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
          rows={orders}
          columns={[
            {
              key: "reference",
              label: t("order"),
              render: (order) => (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto whitespace-normal break-all text-left"
                  onClick={() => setSelectedId(order.id)}
                  aria-label={`${t("detail")}: ${order.reference}`}
                >
                  {order.reference}
                </Button>
              ),
            },
            { key: "client", label: t("client"), render: (order) => order.clientName ?? "—" },
            {
              key: "date",
              label: t("date"),
              render: (order) =>
                format.dateTime(new Date(order.placedAt), { dateStyle: "medium", timeZone: "UTC" }),
            },
            {
              key: "total",
              label: c("subtotal"),
              render: (order) =>
                format.number(Number(order.subtotal), {
                  style: "currency",
                  currency: order.currency,
                }),
            },
            {
              key: "status",
              label: common("statusLabel"),
              render: (order) => (
                <span className="rounded-full border px-3 py-1 text-xs">
                  {c(`statuses.${order.status}`)}
                </span>
              ),
            },
            {
              key: "actions",
              label: common("actions"),
              render: (order) =>
                canWrite ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`/orders/${order.id}/edit`}
                      aria-label={`${common("edit")}: ${order.reference}`}
                    >
                      {common("edit")}
                    </Link>
                  </Button>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      </QueryState>
      {query.data && !query.isError ? (
        <Pagination page={page} pages={query.data.pagination.pages} onPage={setPage} />
      ) : null}
      {selected ? <OrderDetail order={selected} onClose={() => setSelectedId(null)} /> : null}
    </div>
  );
}
