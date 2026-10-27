"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { InboxScope } from "../schemas/inbox-schema";
import { useConversationOrders } from "../hooks/use-conversation-orders";
import { ConversationOrder } from "./conversation-order";

export function ConversationOrders({
  scope,
  threadId,
  canManage,
}: {
  scope: InboxScope;
  threadId: string;
  canManage: boolean;
}) {
  const t = useTranslations("ConversationCommerce");
  const [cursors, setCursors] = useState<string[]>([]);
  const query = useConversationOrders(scope, threadId, cursors.at(-1));
  return (
    <section className="space-y-3 border-t p-5" aria-label={t("title")}>
      <h3 className="text-sm font-medium">{t("title")}</h3>
      <p className="text-xs leading-6 text-muted-foreground">{t("hint")}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={query.isFetching || !cursors.length}
          onClick={() => setCursors((items) => items.slice(0, -1))}
        >
          {t("previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={query.isFetching || !query.data?.nextCursor || query.isError}
          onClick={() => {
            const next = query.data?.nextCursor;
            if (next) setCursors((items) => [...items, next]);
          }}
        >
          {t("next")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
        >
          {t("refresh")}
        </Button>
      </div>
      {query.isPending ? (
        <output className="block text-xs text-muted-foreground">{t("loading")}</output>
      ) : null}
      {query.isError ? (
        <p role="alert" className="text-xs text-destructive">
          {t("error")}
        </p>
      ) : (
        query.data?.items.map((order) => (
          <ConversationOrder
            key={order.id}
            scope={scope}
            threadId={threadId}
            order={order}
            canManage={canManage}
            refreshing={query.isFetching}
          />
        ))
      )}
      {!query.isPending && !query.isError && !query.data?.items.length ? (
        <p className="text-xs text-muted-foreground">{t("empty")}</p>
      ) : null}
    </section>
  );
}
