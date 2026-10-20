"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useFormatter, useTranslations } from "next-intl";

export function StoreRevenueChart({
  data,
}: {
  data: readonly { name: string; revenue: number }[];
}) {
  const format = useFormatter();
  const t = useTranslations("Reports");
  return (
    <figure
      className="h-60 min-w-0 text-xs text-muted-foreground [&_.recharts-cartesian-axis-tick-value]:fill-current"
      aria-label={t("storeChartHint")}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} layout="vertical" accessibilityLayer>
          <CartesianGrid horizontal={false} stroke="currentColor" className="text-border" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => format.number(value, { notation: "compact" })}
          />
          <YAxis
            dataKey="name"
            type="category"
            tickLine={false}
            axisLine={false}
            width={90}
            tickFormatter={(value: string) =>
              value.length > 13 ? `${value.slice(0, 12)}…` : value
            }
          />
          <Bar
            dataKey="revenue"
            fill="currentColor"
            className="text-primary"
            radius={6}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
