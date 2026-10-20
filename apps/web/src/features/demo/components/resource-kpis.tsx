"use client";

import { useFormatter, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { defaultCurrency } from "@/lib/config/currency";
import { isSale, orderTotal } from "../lib/metrics";
import type { Workspace } from "../types/workspace";

export function ResourceKpis({
  resource,
  workspace,
}: {
  resource: "products" | "orders" | "clients";
  workspace?: Workspace;
}) {
  const t = useTranslations("ResourceKpis");
  const format = useFormatter();
  const products = workspace?.products ?? [];
  const orders = workspace?.orders ?? [];
  const clients = workspace?.clients ?? [];
  const sales = orders.filter(isSale);
  const money = (value: number) =>
    format.number(value, { style: "currency", currency: defaultCurrency });
  const cards = {
    products: [
      { key: "catalog", value: format.number(products.length) },
      { key: "available", value: format.number(products.filter((row) => row.active).length) },
      {
        key: "lowStock",
        value: format.number(
          products.filter((row) => row.active && row.stock <= row.lowStockThreshold).length,
        ),
      },
      {
        key: "inventoryValue",
        value: money(products.reduce((sum, row) => sum + row.price * row.stock, 0)),
      },
    ],
    orders: [
      { key: "totalOrders", value: format.number(orders.length) },
      { key: "collected", value: money(sales.reduce((sum, row) => sum + orderTotal(row), 0)) },
      {
        key: "pending",
        value: format.number(orders.filter((row) => row.status === "pending").length),
      },
      {
        key: "fulfilled",
        value: format.number(orders.filter((row) => row.status === "shipped").length),
      },
    ],
    clients: [
      { key: "contacts", value: format.number(clients.length) },
      { key: "activeClients", value: format.number(clients.filter((row) => row.active).length) },
      { key: "buyers", value: format.number(new Set(sales.map((row) => row.clientId)).size) },
      { key: "vip", value: format.number(clients.filter((row) => row.segment === "vip").length) },
    ],
  } as const;
  return (
    <section aria-label={t("title")} className="space-y-2">
      <p className="text-xs text-muted-foreground">{t("scope")}</p>
      <dl className="grid gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {cards[resource].map((card) => (
          <div key={card.key} className="bg-card p-5">
            <dt className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              {t(card.key)}
              <ArrowUpRight className="size-4 text-primary" aria-hidden="true" />
            </dt>
            <dd className="mt-4 text-3xl tracking-tight tabular-nums">
              {workspace ? card.value : "—"}
            </dd>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{t(`${card.key}Hint`)}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
