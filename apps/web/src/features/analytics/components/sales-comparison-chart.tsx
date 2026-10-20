"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFormatter, useTranslations } from "next-intl";
import { defaultCurrency } from "@/lib/config/currency";
import type {
  MonthlySalesComparison as SalesComparison,
  SalesMetric,
} from "../lib/sales-comparison";
import { SalesComparisonTooltip } from "./sales-comparison-tooltip";

export function SalesComparisonChart({
  data,
  metric,
}: {
  data: SalesComparison["series"];
  metric: SalesMetric;
}) {
  const t = useTranslations("SalesSummary");
  const dashboard = useTranslations("Dashboard");
  const format = useFormatter();
  return (
    <figure
      aria-label={`${dashboard("monthlyChartHint")} · ${dashboard(metric === "revenue" ? "metricRevenue" : "metricOrders")}`}
      className="h-72 min-w-0 text-xs text-muted-foreground [&_.recharts-cartesian-axis-tick-value]:fill-current"
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} accessibilityLayer barGap={3}>
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tickFormatter={(value: string) =>
              format.dateTime(new Date(`${value}T12:00:00Z`), {
                month: "short",
                timeZone: "UTC",
              })
            }
          />
          <YAxis
            allowDecimals={metric !== "orders"}
            width="auto"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) =>
              format.number(
                value,
                metric === "revenue"
                  ? {
                      style: "currency",
                      currency: defaultCurrency,
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }
                  : { notation: "compact", maximumFractionDigits: 0 },
              )
            }
          />
          <Tooltip
            cursor={false}
            content={<SalesComparisonTooltip data={data} metric={metric} />}
          />
          <Bar
            dataKey="previous"
            name={t("previous")}
            fill="currentColor"
            className="text-muted-foreground"
            fillOpacity={0.65}
            radius={4}
            maxBarSize={22}
            isAnimationActive={false}
          />
          <Bar
            dataKey="current"
            name={t("current")}
            fill="currentColor"
            className="text-primary"
            radius={4}
            maxBarSize={22}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
