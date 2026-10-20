"use client";

import { ArrowUpRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
    <section className="rounded-3xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-medium">{t("inbox")}</h2>
        <Link
          href="/conversations"
          aria-label={t("viewConversations")}
          className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="mt-2 space-y-4">
        {conversations.map((conversation) => {
          const client = workspace.clients.find((row) => row.id === conversation.clientId);
          return (
            <li key={conversation.id} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground"
              >
                {(client?.name ?? "?").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs">{client?.name ?? "—"}</span>
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
