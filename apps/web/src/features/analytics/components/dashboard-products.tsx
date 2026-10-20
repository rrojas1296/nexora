"use client";

import { ArrowUpRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { defaultCurrency } from "@/lib/config/currency";
import { Link } from "@/i18n/navigation";
import type { Order, Workspace } from "@/features/demo/types/workspace";
import { getReportRows } from "../lib/report-metrics";

export function DashboardProducts({ workspace, sales }: { workspace: Workspace; sales: Order[] }) {
  const t = useTranslations("Dashboard");
  const format = useFormatter();
  const products = getReportRows(workspace, sales, "products")
    .toSorted((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 4);
  return (
    <section className="min-w-0 rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{t("topProducts")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("productRanking")}</p>
        </div>
        <Link
          href="/products"
          aria-label={t("viewProducts")}
          className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <ol className="mt-5 divide-y divide-border">
        {products.map((product, index) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.id}/edit`}
              className="flex items-center gap-3 rounded-xl py-4 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-medium text-muted-foreground tabular-nums"
              >
                {format.number(index + 1, { minimumIntegerDigits: 2 })}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{product.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("unitsSold", { count: product.quantity })}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {format.number(product.revenue, {
                  style: "currency",
                  currency: defaultCurrency,
                  maximumFractionDigits: 0,
                })}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {products.length ? t("productsScope") : t("noProducts")}
      </p>
    </section>
  );
}
