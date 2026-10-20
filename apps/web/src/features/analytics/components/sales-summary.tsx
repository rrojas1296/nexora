"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { fieldClassName } from "@/components/ui/input-field";
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

export function SalesSummary({
  comparison,
  year,
  years,
  onYearChange,
}: {
  comparison: SalesComparison;
  year: number;
  years: number[];
  onYearChange: (year: number) => void;
}) {
  const t = useTranslations("SalesSummary");
  const dashboard = useTranslations("Dashboard");
  const analytics = useTranslations("Analytics");
  const format = useFormatter();
  const [metric, setMetric] = useState<SalesMetric>("revenue");
  const series = getMonthlyMetricSeries(comparison, metric);
  const numberOptions =
    metric === "revenue"
      ? { style: "currency" as const, currency: "USD" }
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
    <section className="min-w-0 rounded-3xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{chartTitle}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{dashboard("salesHint")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{dashboard("year")}</span>
            <select
              className={cn(fieldClassName, "w-auto rounded-full bg-background py-1.5 text-xs")}
              value={year}
              onChange={(event) => onYearChange(Number(event.target.value))}
            >
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{dashboard("metric")}</span>
            <select
              className={cn(fieldClassName, "w-auto rounded-full bg-background py-1.5 text-xs")}
              value={metric}
              onChange={(event) =>
                setMetric(event.target.value === "orders" ? "orders" : "revenue")
              }
            >
              <option value="revenue">{dashboard("metricRevenue")}</option>
              <option value="orders">{dashboard("metricOrders")}</option>
            </select>
          </label>
        </div>
      </div>
      <div className="mb-3 mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {date(comparison.current.startDate)} — {date(comparison.current.endDate)} ·{" "}
          {metric === "revenue" ? "USD" : dashboard("ordersUnit")} · UTC
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
      <p className="mb-4 text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
        {dashboard("annualTotal", {
          metric: metricLabel,
          value: format.number(
            metric === "revenue" ? comparison.current.revenue : comparison.current.sales.length,
            numberOptions,
          ),
        })}
      </p>
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
