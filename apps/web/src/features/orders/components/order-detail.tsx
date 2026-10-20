"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/features/demo/components/status-badge";
import type { Order, Workspace } from "@/features/demo/types/workspace";
import { orderTotal } from "@/features/demo/lib/metrics";
import { EditorDialog } from "@/features/demo/components/editor-dialog";

export function OrderDetail({
  order,
  workspace,
  onClose,
}: {
  order: Order;
  workspace: Workspace;
  onClose: () => void;
}) {
  const t = useTranslations("Orders");
  const common = useTranslations("Demo");
  const format = useFormatter();
  return (
    <EditorDialog title={order.id} description={t("detailHint")} busy={false} onClose={onClose}>
      <dl className="mb-6 grid grid-cols-2 gap-4 text-xs">
        <div>
          <dt className="text-muted-foreground">{t("client")}</dt>
          <dd className="mt-2">
            {workspace.clients.find((client) => client.id === order.clientId)?.name ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("store")}</dt>
          <dd className="mt-2">
            {workspace.stores.find((store) => store.id === order.storeId)?.name ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("date")}</dt>
          <dd className="mt-2">
            {format.dateTime(new Date(order.createdAt), { dateStyle: "medium", timeZone: "UTC" })}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("total")}</dt>
          <dd className="mt-2">
            {format.number(orderTotal(order), { style: "currency", currency: order.currency })}
          </dd>
        </div>
      </dl>
      <ul className="divide-y rounded-2xl border px-4">
        {order.items.map((item, index) => (
          <li
            key={`${item.productId}-${index}`}
            className="flex justify-between gap-4 py-4 text-xs"
          >
            <span>
              {item.quantity} × {item.name}
              <span className="mt-1 block text-muted-foreground">
                {format.number(item.unitPrice, { style: "currency", currency: order.currency })}
              </span>
            </span>
            <span>
              {format.number(item.unitPrice * item.quantity, {
                style: "currency",
                currency: order.currency,
              })}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between gap-3">
        <StatusBadge status={order.status} />
        <Button asChild variant="outline">
          <Link href={`/orders/${order.id}/edit`}>{common("edit")}</Link>
        </Button>
      </div>
    </EditorDialog>
  );
}
