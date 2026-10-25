"use client";

import dynamic from "next/dynamic";
import { useFormatter, useTranslations } from "next-intl";
import { defaultCurrency } from "@/lib/config/currency";
import { orderStatuses } from "@/features/demo/schemas/workspace-schema";
import type { Order, Workspace } from "@/features/demo/types/workspace";
import { StatusBadge } from "@/features/demo/components/status-badge";
import { getReportRows } from "../lib/report-metrics";
import { ChartPlaceholder } from "./chart-placeholder";

const ProductRevenueChart = dynamic(
  () => import("./product-revenue-chart").then((module) => module.ProductRevenueChart),
  { loading: ChartPlaceholder },
);
const OrderStatusChart = dynamic(
  () => import("./order-status-chart").then((module) => module.OrderStatusChart),
  { loading: ChartPlaceholder },
);
export function ReportCharts({
  workspace,
  orders,
  sales,
}: {
  workspace: Workspace;
  orders: readonly Order[];
  sales: readonly Order[];
}) {
  const t = useTranslations("Reports");
  const format = useFormatter();
  const products = getReportRows(workspace, sales, "products").slice(0, 5);
  const statuses = orderStatuses.map((status) => ({
    status,
    value: orders.filter((row) => row.status === status).length,
  }));
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="min-w-0 rounded-3xl border bg-card p-6">
        <p className="text-xs text-muted-foreground">{t("distribution")}</p>
        <h2 className="mt-2 text-xl">{t("byProduct")}</h2>
        <p className="mt-2 mb-5 text-xs leading-6 text-muted-foreground">{t("productHint")}</p>
        {sales.length ? (
          <ProductRevenueChart data={products} />
        ) : (
          <p className="flex h-60 items-center justify-center text-center text-xs text-muted-foreground">
            {t("noSales")}
          </p>
        )}
        <dl className="mt-4 divide-y border-t">
          {products.map((row) => (
            <div key={row.id} className="flex justify-between gap-4 py-3 text-xs">
              <dt>{row.name}</dt>
              <dd className="tabular-nums">
                {format.number(row.revenue, { style: "currency", currency: defaultCurrency })}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="min-w-0 rounded-3xl border bg-card p-6">
        <p className="text-xs text-muted-foreground">{t("operations")}</p>
        <h2 className="mt-2 text-xl">{t("byStatus")}</h2>
        <p className="mt-2 mb-5 text-xs leading-6 text-muted-foreground">{t("statusHint")}</p>
        <div className="relative">
          {orders.length ? <OrderStatusChart data={statuses} /> : <div className="h-48" />}
          <p className="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 text-center text-3xl tabular-nums">
            {format.number(orders.length)}
            <span className="mt-1 block text-xs text-muted-foreground">{t("orders")}</span>
          </p>
        </div>
        <dl className="mt-4 divide-y border-t">
          {statuses.map((row) => (
            <div key={row.status} className="flex items-center justify-between gap-4 py-3">
              <dt>
                <StatusBadge status={row.status} />
              </dt>
              <dd className="text-xs tabular-nums">
                {format.number(row.value)}
                <span className="ms-2 text-muted-foreground">
                  {format.number(orders.length ? row.value / orders.length : 0, {
                    style: "percent",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
