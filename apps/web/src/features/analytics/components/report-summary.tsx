"use client";

import { useFormatter, useTranslations } from "next-intl";
import { ScanLine } from "lucide-react";
import type { getMetrics } from "@/features/demo/lib/metrics";

export function ReportSummary({ metrics }: { metrics: ReturnType<typeof getMetrics> }) {
  const t = useTranslations("Reports");
  const format = useFormatter();
  const money = (value: number) => format.number(value, { style: "currency", currency: "USD" });
  return (
    <section className="rounded-3xl border bg-card p-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ScanLine className="size-4 text-primary" aria-hidden="true" />
        {t("summary")}
      </div>
      <h2 className="mt-7 text-sm text-muted-foreground">{t("revenue")}</h2>
      <p className="mt-2 text-4xl tracking-tight tabular-nums">{money(metrics.revenue)}</p>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">{t("revenueHint")}</p>
      <dl className="mt-7 grid gap-5 border-t pt-5 sm:grid-cols-3 xl:grid-cols-1">
        <div>
          <dt className="text-xs text-muted-foreground">{t("orders")}</dt>
          <dd className="mt-2 text-xl tabular-nums">{format.number(metrics.orders.length)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("paidShare")}</dt>
          <dd className="mt-2 text-xl tabular-nums">
            {format.number(
              metrics.orders.length ? metrics.sales.length / metrics.orders.length : 0,
              { style: "percent", maximumFractionDigits: 1 },
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("average")}</dt>
          <dd className="mt-2 text-xl tabular-nums">{money(metrics.average)}</dd>
        </div>
      </dl>
      <p className="mt-7 border-t pt-4 text-xs leading-6 text-muted-foreground">{t("method")}</p>
    </section>
  );
}
