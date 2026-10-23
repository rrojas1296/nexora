"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { ConversationComposer } from "./conversation-composer";
import { useInboxMessages } from "../hooks/use-inbox";
import type { InboxScope, InboxThread } from "../schemas/inbox-schema";

export function ConversationPanel({
  scope,
  conversation,
  onSelect,
}: {
  scope: InboxScope;
  conversation: InboxThread;
  onSelect: () => void;
}) {
  const t = useTranslations("WhatsappInbox");
  const format = useFormatter();
  const [cursors, setCursors] = useState<string[]>([]);
  const cursor = cursors.at(-1);
  const query = useInboxMessages(scope, conversation.id, cursor);
  const messages = query.isError ? [] : (query.data?.items.toReversed() ?? []);
  const nextCursor = query.data?.nextCursor;
  const logRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    if (!cursor && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lastId, cursor]);

  return (
    <section aria-label={t("chat")} className="min-w-0 rounded-3xl border bg-card xl:col-span-3">
      <div className="space-y-2 border-b p-5">
        <h2 className="break-words text-lg">{conversation.contactName}</h2>
        <p className="text-xs text-muted-foreground" dir="ltr">
          +{conversation.contactWaId}
        </p>
        <p className="break-all text-xs text-muted-foreground">
          {t("businessNumber", { id: conversation.phoneNumberId })}
        </p>
      </div>
      <div className="flex flex-wrap justify-between gap-2 border-b p-4">
        <Button
          variant="outline"
          size="sm"
          disabled={!nextCursor || query.isFetching}
          onClick={() => {
            if (nextCursor) setCursors((items) => [...items, nextCursor]);
          }}
        >
          {t("olderMessages")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!cursors.length || query.isFetching}
          onClick={() => setCursors((items) => items.slice(0, -1))}
        >
          {t("newer")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={query.isFetching}
          onClick={() => {
            if (cursors.length) setCursors([]);
            else void query.refetch();
          }}
        >
          {t("latest")}
        </Button>
      </div>
      <div
        ref={logRef}
        role="log"
        aria-label={t("messages")}
        aria-live="polite"
        aria-relevant="additions"
        className="flex h-96 flex-col gap-4 overflow-y-auto overscroll-contain p-5"
      >
        {query.isPending ? <p className="text-xs text-muted-foreground">{t("loading")}</p> : null}
        {query.isError ? (
          <div className="space-y-3">
            <p role="alert" className="text-xs text-destructive">
              {t("error")}
            </p>
            <Button
              variant="outline"
              size="sm"
              disabled={query.isFetching}
              onClick={() => {
                void query.refetch();
              }}
            >
              {t("refresh")}
            </Button>
          </div>
        ) : null}
        {!query.isPending && !query.isError && !messages.length ? (
          <p className="text-xs text-muted-foreground">{t("noMessages")}</p>
        ) : null}
        {messages.map((message) => (
          <article
            key={message.id}
            className={cn(
              "max-w-9/10 rounded-2xl px-4 py-3",
              message.direction === "OUTBOUND"
                ? "self-end border border-primary/20 bg-primary/10"
                : "self-start bg-secondary",
              message.sendStatus === "REJECTED" && "border-destructive/30 bg-destructive/10",
            )}
          >
            <p className="mb-1 text-xs font-medium">
              {message.direction === "OUTBOUND" ? t("outbound") : t("inbound")}
            </p>
            {message.type !== "text" ? (
              <p className="mb-1 text-xs text-muted-foreground">
                {t("attachment", { type: message.type })}
              </p>
            ) : null}
            {message.body ? (
              <p className="whitespace-pre-wrap break-words text-xs leading-6">{message.body}</p>
            ) : null}
            <time dateTime={message.sentAt} className="mt-2 block text-xs text-muted-foreground">
              {format.dateTime(new Date(message.sentAt), {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "UTC",
              })}{" "}
              UTC
            </time>
            {message.direction === "OUTBOUND" ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`sendStatuses.${message.sendStatus ?? "UNKNOWN"}`)}
              </p>
            ) : null}
          </article>
        ))}
      </div>
      <ConversationComposer
        scope={scope}
        threadId={conversation.id}
        reply={query.isError ? undefined : query.data?.reply}
        onShowLatest={() => {
          onSelect();
          setCursors([]);
        }}
      />
    </section>
  );
}
