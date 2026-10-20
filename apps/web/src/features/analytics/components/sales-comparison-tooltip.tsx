"use client";

import { useFormatter, useTranslations } from "next-intl";
import type {
  MonthlySalesComparison as SalesComparison,
  SalesMetric,
} from "../lib/sales-comparison";

export function SalesComparisonTooltip({
  active,
  label,
  data,
  metric,
}: {
  active?: boolean;
  label?: unknown;
  data: SalesComparison["series"];
  metric: SalesMetric;
}) {
  const t = useTranslations("SalesSummary");
  const format = useFormatter();
  const dashboard = useTranslations("Dashboard");
  const row = typeof label === "string" ? data.find((item) => item.date === label) : undefined;
  if (!active || !row) return null;
  return (
    <dl className="space-y-3 rounded-xl border bg-popover p-3 text-xs text-popover-foreground shadow-md">
      {(["previous", "current"] as const).map((period) => (
        <div key={period}>
          <dt className="text-muted-foreground">
            {t(period)} ·{" "}
            {format.dateTime(
              new Date(`${period === "current" ? row.date : row.previousDate}T12:00:00Z`),
              { month: "long", year: "numeric", timeZone: "UTC" },
            )}
          </dt>
          <dd className="mt-1 tabular-nums">
            {format.number(
              row[period],
              metric === "revenue"
                ? { style: "currency", currency: "USD" }
                : { maximumFractionDigits: 0 },
            )}{" "}
            · {dashboard(metric === "revenue" ? "metricRevenue" : "metricOrders")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
