"use client";

import { ArrowUpRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/features/demo/components/status-badge";
import { orderTotal } from "@/features/demo/lib/metrics";
import type { Order, Workspace } from "@/features/demo/types/workspace";

export function DashboardOrders({ workspace, orders }: { workspace: Workspace; orders: Order[] }) {
  const t = useTranslations("Dashboard");
  const format = useFormatter();
  const recent = orders.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold">{t("recentOrders")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("ordersHint")}</p>
        </div>
        <Link
          href="/orders"
          className="inline-flex shrink-0 items-center gap-1.5 rounded text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          {t("viewAll")}
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-192 text-start text-sm">
          <caption className="sr-only">{t("recentOrders")}</caption>
          <thead className="border-y bg-muted/30 text-xs text-muted-foreground">
            <tr>
              {(["order", "client", "product", "orderDate", "total", "status"] as const).map(
                (key) => (
                  <th key={key} scope="col" className="px-5 py-3 text-start font-normal">
                    {t(key)}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {recent.map((order) => {
              const client = workspace.clients.find((row) => row.id === order.clientId);
              return (
                <tr key={order.id} className="hover:bg-muted/30">
                  <th scope="row" className="max-w-40 px-5 py-4 text-start font-medium">
                    <Link
                      href={`/orders/${order.id}/edit`}
                      className="block truncate rounded hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      title={order.id}
                    >
                      {order.id}
                    </Link>
                  </th>
                  <td className="px-5 py-4" aria-label={client?.name ?? "—"}>
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground"
                      >
                        {(client?.name ?? "?").slice(0, 2).toUpperCase()}
                      </span>
                      <span className="max-w-36 truncate">{client?.name ?? "—"}</span>
                    </span>
                  </td>
                  <td className="max-w-48 px-5 py-4 text-muted-foreground">
                    <span className="block truncate">{order.items[0]?.name ?? "—"}</span>
                    {order.items.length > 1 ? (
                      <span className="text-xs">
                        {t("moreItems", { count: order.items.length - 1 })}
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-xs text-muted-foreground">
                    <time dateTime={order.createdAt}>
                      {format.dateTime(new Date(order.createdAt), {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </time>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums">
                    {format.number(orderTotal(order), {
                      style: "currency",
                      currency: order.currency,
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!recent.length ? (
        <p className="px-5 py-10 text-sm text-muted-foreground">{t("noOrders")}</p>
      ) : null}
    </section>
  );
}
