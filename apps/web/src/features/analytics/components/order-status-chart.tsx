"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";

const colors = {
  pending: "text-chart-3",
  paid: "text-primary",
  shipped: "text-chart-2",
  cancelled: "text-muted-foreground",
} as const;
export function OrderStatusChart({
  data,
}: {
  data: readonly { status: keyof typeof colors; value: number }[];
}) {
  const t = useTranslations("Reports");
  return (
    <figure className="h-48" aria-label={t("statusChartHint")}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart accessibilityLayer>
          <Pie
            data={data}
            dataKey="value"
            nameKey="status"
            innerRadius="72%"
            outerRadius="92%"
            paddingAngle={3}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((row) => (
              <Cell key={row.status} fill="currentColor" className={colors[row.status]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </figure>
  );
}
