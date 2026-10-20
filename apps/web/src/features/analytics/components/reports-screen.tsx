"use client";

import { useState } from "react";
import { Download, FileChartColumn } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input-field";
import { useWorkspace } from "@/features/demo/hooks/use-workspace";
import { QueryState } from "@/features/demo/components/query-state";
import { demoPeriodEnd, getMetrics } from "@/features/demo/lib/metrics";
import { getReportRows, type ReportView } from "../lib/report-metrics";
import { exportReport } from "../lib/export-report";
import { ReportSummary } from "./report-summary";
import { ReportCharts } from "./report-charts";
import { ReportsBreakdown } from "./reports-breakdown";

export function ReportsScreen() {
  const t = useTranslations("Reports");
  const analytics = useTranslations("Analytics");
  const common = useTranslations("Demo");
  const format = useFormatter();
  const query = useWorkspace();
  const [days, setDays] = useState(30);
  const [store, setStore] = useState("all");
  const [view, setView] = useState<ReportView>("products");
  const workspace = query.data;
  const metrics = workspace
    ? getMetrics(
        {
          ...workspace,
          orders: workspace.orders.filter((row) => store === "all" || row.storeId === store),
        },
        days,
      )
    : null;
  const rows = workspace && metrics ? getReportRows(workspace, metrics.sales, view) : [];
  return (
    <div className="space-y-6">
      <section
        aria-label={t("filters")}
        className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border bg-card p-5"
      >
        <div className="flex flex-wrap gap-4">
          <label className="space-y-2 text-xs">
            <span className="block">{analytics("period")}</span>
            <select
              className={fieldClassName}
              value={days}
              onChange={(event) => setDays(event.target.value === "7" ? 7 : 30)}
            >
              <option value={7}>{analytics("sevenDays")}</option>
              <option value={30}>{analytics("thirtyDays")}</option>
            </select>
          </label>
          <label className="space-y-2 text-xs">
            <span className="block">{t("store")}</span>
            <select
              className={fieldClassName}
              value={store}
              onChange={(event) => setStore(event.target.value)}
            >
              <option value="all">{common("all")}</option>
              {workspace?.stores.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Button
          variant="outline"
          disabled={!rows.length || query.isPending || query.isError}
          onClick={() => {
            exportReport(
              [
                t(view === "products" ? "product" : "client"),
                t("units"),
                t("orders"),
                `${t("revenue")} (USD)`,
                `${t("share")} (%)`,
                t("periodDays"),
                t("cutoff"),
                t("store"),
              ],
              rows.map((row) => [
                row.name,
                row.quantity,
                row.orders,
                Number(row.revenue.toFixed(2)),
                metrics?.revenue ? Number(((row.revenue / metrics.revenue) * 100).toFixed(2)) : 0,
                days,
                demoPeriodEnd,
                store === "all"
                  ? common("all")
                  : (workspace?.stores.find((row) => row.id === store)?.name ?? store),
              ]),
              `report-${view}-${days}d.csv`,
            );
          }}
        >
          <Download className="size-4" aria-hidden="true" />
          {t("export")}
        </Button>
      </section>
      <p className="text-xs leading-6 text-muted-foreground">
        {analytics("periodHint", {
          date: format.dateTime(new Date(demoPeriodEnd), { dateStyle: "medium", timeZone: "UTC" }),
        })}
      </p>
      <QueryState
        pending={query.isPending}
        error={query.isError}
        empty={!workspace?.orders.length}
        retry={() => {
          void query.refetch();
        }}
      >
        {workspace && metrics ? (
          <>
            <div className="grid items-start gap-5 xl:grid-cols-4">
              <ReportSummary metrics={metrics} />
              <div className="min-w-0 xl:col-span-3">
                <ReportCharts
                  workspace={workspace}
                  orders={metrics.orders}
                  sales={metrics.sales}
                  store={store}
                />
              </div>
            </div>
            <section className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileChartColumn className="size-4 text-primary" aria-hidden="true" />
                    {t("detail")}
                  </div>
                  <h2 className="mt-2 text-xl">{t("performance")}</h2>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {t("performanceHint")}
                  </p>
                </div>
                <div
                  className="flex gap-1 rounded-full border bg-card p-1"
                  aria-label={t("groupBy")}
                >
                  {(["products", "clients"] as const).map((value) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={view === value ? "secondary" : "ghost"}
                      aria-pressed={view === value}
                      onClick={() => setView(value)}
                    >
                      {t(value)}
                    </Button>
                  ))}
                </div>
              </div>
              <ReportsBreakdown rows={rows} view={view} revenue={metrics.revenue} />
            </section>
          </>
        ) : null}
      </QueryState>
    </div>
  );
}
