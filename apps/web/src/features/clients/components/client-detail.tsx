"use client";

import { useFormatter, useTranslations } from "next-intl";
import type { Client, Workspace } from "@/features/demo/types/workspace";
import { orderTotal } from "@/features/demo/lib/metrics";
import { EditorDialog } from "@/features/demo/components/editor-dialog";
import { StatusBadge } from "@/features/demo/components/status-badge";

export function ClientDetail({
  client,
  workspace,
  onClose,
}: {
  client: Client;
  workspace: Workspace;
  onClose: () => void;
}) {
  const t = useTranslations("Clients");
  const format = useFormatter();
  const orders = workspace.orders
    .filter((order) => order.clientId === client.id)
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  const conversations = workspace.conversations.filter(
    (conversation) => conversation.clientId === client.id,
  );
  return (
    <EditorDialog title={client.name} description={t("history")} busy={false} onClose={onClose}>
      <dl className="grid gap-4 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{t("email")}</dt>
          <dd className="mt-2 break-all">{client.email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("phone")}</dt>
          <dd className="mt-2">{client.phone}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">{t("notes")}</dt>
          <dd className="mt-2 whitespace-pre-wrap break-words">{client.notes || "—"}</dd>
        </div>
      </dl>
      <h3 className="mt-7 text-sm">{t("orders")}</h3>
      <ul className="mt-3 divide-y rounded-2xl border px-4">
        {orders.map((order) => (
          <li
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs"
          >
            <span>
              {order.id}
              <span className="mt-1 block text-muted-foreground">
                {format.dateTime(new Date(order.createdAt), {
                  dateStyle: "medium",
                  timeZone: "UTC",
                })}
              </span>
            </span>
            <span>
              {format.number(orderTotal(order), { style: "currency", currency: order.currency })}
            </span>
            <StatusBadge status={order.status} />
          </li>
        ))}
      </ul>
      {!orders.length ? (
        <p className="mt-3 text-xs text-muted-foreground">{t("noOrders")}</p>
      ) : null}
      <h3 className="mt-7 text-sm">{t("conversations")}</h3>
      <ul className="mt-3 space-y-3">
        {conversations.map((conversation) => (
          <li key={conversation.id} className="rounded-2xl border p-4">
            <StatusBadge status={conversation.status} />
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              {conversation.messages.at(-1)?.body ?? "—"}
            </p>
          </li>
        ))}
      </ul>
      {!conversations.length ? (
        <p className="mt-3 text-xs text-muted-foreground">{t("noConversations")}</p>
      ) : null}
    </EditorDialog>
  );
}
