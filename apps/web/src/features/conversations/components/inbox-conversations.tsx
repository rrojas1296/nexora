"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useInboxThreads } from "../hooks/use-inbox";
import type { InboxScope } from "../schemas/inbox-schema";
import { ConversationPanel } from "./conversation-panel";

export function InboxConversations({ scope }: { scope: InboxScope }) {
  const t = useTranslations("WhatsappInbox");
  const format = useFormatter();
  const [cursors, setCursors] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useInboxThreads(scope, cursors.at(-1));
  const conversations = query.isError ? [] : (query.data?.items ?? []);
  const selected = conversations.find((thread) => thread.id === selectedId) ?? conversations[0];
  const nextCursor = query.data?.nextCursor;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-3xl border bg-card p-5">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-medium">{t("title")}</p>
          <p className="text-xs leading-6 text-muted-foreground">{t("description")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={query.isFetching}
          onClick={() => {
            void query.refetch();
          }}
        >
          <RefreshCw
            className={cn(
              "size-3.5",
              query.isFetching && "animate-spin motion-reduce:animate-none",
            )}
            aria-hidden="true"
          />
          {t("refresh")}
        </Button>
      </div>
      {query.isPending ? <p className="text-sm text-muted-foreground">{t("loading")}</p> : null}
      {query.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t("error")}
        </p>
      ) : null}
      {!query.isPending && !query.isError && !conversations.length ? (
        <p className="rounded-3xl border bg-card p-6 text-sm leading-7 text-muted-foreground">
          {t("empty")}
        </p>
      ) : null}
      {conversations.length ? (
        <div className="grid items-start gap-5 xl:grid-cols-5">
          <section
            aria-label={t("list")}
            className="min-w-0 overflow-hidden rounded-3xl border bg-card xl:col-span-2"
          >
            <ul className="max-h-120 divide-y overflow-y-auto">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    aria-pressed={selected?.id === conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={cn(
                      "w-full p-5 text-start transition-colors hover:bg-secondary/40",
                      selected?.id === conversation.id && "bg-secondary/60",
                    )}
                  >
                    <span className="block truncate text-sm font-medium">
                      {conversation.contactName}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground" dir="ltr">
                      +{conversation.contactWaId}
                    </span>
                    <p className="mt-3 line-clamp-2 break-words text-xs leading-5 text-muted-foreground">
                      {conversation.lastMessageBody ||
                        t("attachment", { type: conversation.lastMessageType })}
                    </p>
                    <time
                      dateTime={conversation.lastMessageAt}
                      className="mt-3 block text-xs text-muted-foreground"
                    >
                      {format.dateTime(new Date(conversation.lastMessageAt), {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "UTC",
                      })}{" "}
                      UTC
                    </time>
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap justify-between gap-2 border-t p-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!cursors.length || query.isFetching}
                onClick={() => setCursors((items) => items.slice(0, -1))}
              >
                {t("newer")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!nextCursor || query.isFetching}
                onClick={() => {
                  if (nextCursor) setCursors((items) => [...items, nextCursor]);
                }}
              >
                {t("older")}
              </Button>
            </div>
          </section>
          {selected ? (
            <ConversationPanel
              key={selected.id}
              scope={scope}
              conversation={selected}
              onSelect={() => setSelectedId(selected.id)}
            />
          ) : null}
        </div>
      ) : null}
      {cursors.length && !conversations.length ? (
        <Button variant="outline" size="sm" onClick={() => setCursors([])}>
          {t("latest")}
        </Button>
      ) : null}
    </div>
  );
}
