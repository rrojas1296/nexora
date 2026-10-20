"use client";

import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import type { MonthlySalesComparison as SalesComparison } from "../lib/sales-comparison";

export function MetricCards({
  comparison,
  conversations,
}: {
  comparison: SalesComparison;
  conversations: number;
}) {
  const t = useTranslations("Dashboard");
  const format = useFormatter();
  const { current, previous } = comparison;
  const paidShare = current.orders.length ? current.sales.length / current.orders.length : 0;
  const previousShare = previous.orders.length ? previous.sales.length / previous.orders.length : 0;
  const relative = (value: number, baseline: number) =>
    baseline > 0 ? (value - baseline) / baseline : null;
  const currency = (value: number) => format.number(value, { style: "currency", currency: "USD" });
  const cards = [
    { key: "sales", value: currency(current.revenue), change: comparison.change },
    { key: "conversations", value: format.number(conversations), change: null },
    {
      key: "paidShare",
      value: format.number(paidShare, { style: "percent", maximumFractionDigits: 1 }),
      change: previous.orders.length ? relative(paidShare, previousShare) : null,
    },
    {
      key: "average",
      value: currency(current.average),
      change: relative(current.average, previous.average),
    },
  ] as const;
  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ key, value, change }) => (
        <div key={key} className="min-w-0 rounded-3xl border bg-card px-5 py-4 sm:py-5">
          <dt className="text-sm text-muted-foreground">{t(key)}</dt>
          <dd
            className="mt-3 truncate text-3xl font-semibold tracking-tight tabular-nums"
            title={value}
          >
            {value}
          </dd>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {key === "conversations" ? (
              t("conversationsScope")
            ) : change === null ? (
              t("noBaseline")
            ) : (
              <>
                <span
                  className={cn(
                    "font-medium",
                    change > 0
                      ? "text-accent-foreground"
                      : change < 0
                        ? "text-destructive"
                        : "text-foreground",
                  )}
                >
                  {format.number(change, {
                    style: "percent",
                    signDisplay: "exceptZero",
                    maximumFractionDigits: 1,
                  })}
                </span>{" "}
                {t("versusPrevious")}
              </>
            )}
          </p>
        </div>
      ))}
    </dl>
  );
}
