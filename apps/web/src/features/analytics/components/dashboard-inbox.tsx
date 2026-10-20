"use client";

import { ArrowUpRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/features/demo/components/status-badge";
import type { Workspace } from "@/features/demo/types/workspace";

export function DashboardInbox({ workspace }: { workspace: Workspace }) {
  const t = useTranslations("Dashboard");
  const format = useFormatter();
  const conversations = workspace.conversations
    .flatMap((row) => {
      const lastMessage = row.messages.toSorted((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      )[0];
      return lastMessage ? [{ ...row, lastMessage }] : [];
    })
    .toSorted((a, b) => b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt))
    .slice(0, 3);
  return (
    <section className="min-w-0 rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t("inbox")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("recentMessages")}</p>
        </div>
        <Link
          href="/conversations"
          aria-label={t("viewConversations")}
          className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="mt-5 divide-y divide-border">
        {conversations.map((conversation) => {
          const client = workspace.clients.find((row) => row.id === conversation.clientId);
          return (
            <li key={conversation.id} className="py-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium text-muted-foreground"
                >
                  {(client?.name ?? "?").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{client?.name ?? "—"}</span>
                    <time
                      dateTime={conversation.lastMessage?.createdAt}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {format.dateTime(new Date(conversation.lastMessage.createdAt), {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </time>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {conversation.lastMessage?.body}
                  </p>
                </div>
                <span className="hidden shrink-0 sm:block">
                  <StatusBadge status={conversation.status} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {conversations.length ? t("inboxScope") : t("noConversations")}
      </p>
    </section>
  );
}
