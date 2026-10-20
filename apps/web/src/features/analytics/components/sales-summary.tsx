"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { defaultCurrency } from "@/lib/config/currency";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  getMonthlyMetricSeries,
  type SalesMetric,
  type MonthlySalesComparison as SalesComparison,
} from "../lib/sales-comparison";
import { ChartPlaceholder } from "./chart-placeholder";

const SalesComparisonChart = dynamic(
  () => import("./sales-comparison-chart").then((module) => module.SalesComparisonChart),
  { loading: ChartPlaceholder },
);

export function SalesSummary({ comparison, year }: { comparison: SalesComparison; year: number }) {
  const t = useTranslations("SalesSummary");
  const dashboard = useTranslations("Dashboard");
  const analytics = useTranslations("Analytics");
  const format = useFormatter();
  const [metric, setMetric] = useState<SalesMetric>("revenue");
  const series = getMonthlyMetricSeries(comparison, metric);
  const numberOptions =
    metric === "revenue"
      ? { style: "currency" as const, currency: defaultCurrency }
      : { maximumFractionDigits: 0 };
  const metricLabel = dashboard(metric === "revenue" ? "metricRevenue" : "metricOrders");
  const chartTitle = dashboard(metric === "revenue" ? "monthlySales" : "monthlySoldOrders");
  const date = (value: string) =>
    format.dateTime(new Date(`${value}T12:00:00Z`), {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return (
    <section className="min-w-0 rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{chartTitle}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{dashboard("salesHint")}</p>
        </div>
        <fieldset className="flex flex-wrap gap-1 rounded-2xl border bg-background p-1">
          <legend className="sr-only">{dashboard("metric")}</legend>
          {(["revenue", "orders"] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={metric === value ? "secondary" : "ghost"}
              aria-pressed={metric === value}
              onClick={() => setMetric(value)}
            >
              {dashboard(value === "revenue" ? "metricRevenue" : "metricOrders")}
            </Button>
          ))}
        </fieldset>
      </div>
      <div className="my-6" aria-live="polite" aria-atomic="true">
        <p className="text-xs text-muted-foreground">
          {dashboard("annualMetric", { metric: metricLabel, year })}
        </p>
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
          {format.number(
            metric === "revenue" ? comparison.current.revenue : comparison.current.sales.length,
            numberOptions,
          )}
        </p>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {date(comparison.current.startDate)} — {date(comparison.current.endDate)} ·{" "}
          {metric === "revenue" ? defaultCurrency : dashboard("ordersUnit")} · UTC
        </span>
        <div className="flex gap-4">
          {(["current", "previous"] as const).map((period) => (
            <span key={period} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 rounded-full",
                  period === "current" ? "bg-primary" : "bg-muted-foreground/65",
                )}
              />
              {period === "current" ? year : year - 1}
            </span>
          ))}
        </div>
      </div>
      <SalesComparisonChart data={series} metric={metric} />
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {dashboard("monthlyHint", { year, previous: year - 1 })}
      </p>
      <details className="mt-3 border-t pt-3 text-xs">
        <summary className="cursor-pointer text-muted-foreground">
          {analytics("accessibleData")}
        </summary>
        <div className="mt-3 max-h-64 overflow-auto">
          <table className="w-full text-start">
            <caption className="sr-only">
              {chartTitle} · {metricLabel}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="p-2 text-start">
                  {t("currentDate")}
                </th>
                <th scope="col" className="p-2 text-end">
                  {t("current")}
                </th>
                <th scope="col" className="p-2 text-start">
                  {t("previousDate")}
                </th>
                <th scope="col" className="p-2 text-end">
                  {t("previous")}
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((row) => (
                <tr key={row.date} className="border-t">
                  <th scope="row" className="p-2 text-start font-normal">
                    {date(row.date)}
                  </th>
                  <td className="p-2 text-end tabular-nums">
                    {format.number(row.current, numberOptions)}
                  </td>
                  <td className="p-2">{date(row.previousDate)}</td>
                  <td className="p-2 text-end tabular-nums">
                    {format.number(row.previous, numberOptions)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
