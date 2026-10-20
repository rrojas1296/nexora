"use client";

import { ArrowUpRight, Package } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
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
    <section className="rounded-3xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-medium">{t("topProducts")}</h2>
        <Link
          href="/products"
          aria-label={t("viewProducts")}
          className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="mt-2 space-y-3">
        {products.map((product) => (
          <li key={product.id}>
            <Link
              href={`/products/${product.id}/edit`}
              className="flex items-center gap-2 rounded-xl py-1 hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Package className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs">{product.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("unitsSold", { count: product.quantity })}
                </span>
              </span>
              <span className="text-xs font-medium tabular-nums">
                {format.number(product.revenue, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {products.length ? t("productsScope") : t("noProducts")}
      </p>
    </section>
  );
}
