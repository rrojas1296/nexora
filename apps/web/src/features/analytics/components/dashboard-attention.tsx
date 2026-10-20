"use client";

import { ArrowRight, MessageSquare, Package, ShoppingBag } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Workspace } from "@/features/demo/types/workspace";

export function DashboardAttention({ workspace }: { workspace: Workspace }) {
  const t = useTranslations("Dashboard");
  const format = useFormatter();
  const items = [
    {
      key: "pendingOrders",
      count: workspace.orders.filter((order) => order.status === "pending").length,
      href: "/orders",
      icon: ShoppingBag,
    },
    {
      key: "humanConversations",
      count: workspace.conversations.filter(
        (conversation) => conversation.assignedTo === "human" && conversation.status !== "closed",
      ).length,
      href: "/conversations",
      icon: MessageSquare,
    },
    {
      key: "outOfStock",
      count: workspace.products.filter((product) => product.active && product.stock === 0).length,
      href: "/products",
      icon: Package,
    },
  ] as const;
  return (
    <section className="rounded-3xl border bg-card p-5 sm:p-6">
      <h2 className="text-sm font-semibold">{t("attention")}</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("attentionScope")}</p>
      <ul className="mt-4 divide-y divide-border">
        {items.map(({ key, count, href, icon: Icon }) => (
          <li key={key}>
            <Link
              href={href}
              className="group flex items-center gap-3 rounded-xl py-4 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-sm">{t(key)}</span>
              <span className="text-lg font-semibold tabular-nums">{format.number(count)}</span>
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
