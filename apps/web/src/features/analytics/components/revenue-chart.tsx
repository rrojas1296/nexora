"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFormatter, useTranslations } from "next-intl";
import { RevenueTooltip } from "./revenue-tooltip";

export function RevenueChart({ data }: { data: readonly { date: string; revenue: number }[] }) {
  const t = useTranslations("Analytics");
  const format = useFormatter();
  return (
    <figure
      aria-label={t("chartDescription")}
      className="h-64 min-w-0 text-xs text-muted-foreground"
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="currentColor" className="text-border" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: string) =>
              format.dateTime(new Date(`${value}T12:00:00Z`), {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })
            }
          />
          <YAxis
            width="auto"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => format.number(value, { maximumFractionDigits: 0 })}
          />
          <Tooltip content={<RevenueTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="currentColor"
            fill="currentColor"
            fillOpacity={0.12}
            className="text-primary"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  );
}
