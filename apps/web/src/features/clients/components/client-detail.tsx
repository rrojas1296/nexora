"use client";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useOrders } from "@/features/commerce/hooks/use-commerce";
import { Link } from "@/i18n/navigation";
import { EditorDialog } from "@/features/demo/components/editor-dialog";
import { CommerceQueryState as QueryState } from "@/features/commerce/components/commerce-query-state";
import { Pagination } from "@/features/demo/components/pagination";
import type { Client } from "../schemas/client-schema";
export function ClientDetail({ client, onClose }: { client: Client; onClose: () => void }) {
  const t = useTranslations("Clients");
  const c = useTranslations("Commerce");
  const format = useFormatter();
  const [page, setPage] = useState(1);
  const query = useOrders({ clientId: client.id, page, pageSize: 10 });
  return (
    <EditorDialog title={client.name} description={t("history")} busy={false} onClose={onClose}>
      <dl className="grid gap-4 text-xs sm:grid-cols-2">
        {[
          { label: t("email"), value: client.email },
          { label: t("phone"), value: client.phone },
          { label: t("notes"), value: client.notes },
        ].map((field) => (
          <div key={field.label}>
            <dt className="text-muted-foreground">{field.label}</dt>
            <dd className="mt-2 whitespace-pre-wrap break-words">{field.value || "—"}</dd>
          </div>
        ))}
      </dl>
      <h3 className="mt-7 text-sm">{t("orders")}</h3>
      <QueryState
        pending={query.isPending}
        error={query.isError}
        empty={!query.data?.data.length}
        retry={() => {
          void query.refetch();
        }}
      >
        <ul className="mt-3 divide-y rounded-2xl border px-4">
          {query.data?.data.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 text-xs"
            >
              <Link
                href={`/orders/${order.id}/edit`}
                className="break-all underline underline-offset-4"
              >
                {order.reference}
              </Link>
              <span>
                {format.number(Number(order.subtotal), {
                  style: "currency",
                  currency: order.currency,
                })}
              </span>
              <span>{c(`statuses.${order.status}`)}</span>
            </li>
          ))}
        </ul>
      </QueryState>
      {query.data && !query.isError ? (
        <Pagination page={page} pages={query.data.pagination.pages} onPage={setPage} />
      ) : null}
    </EditorDialog>
  );
}
