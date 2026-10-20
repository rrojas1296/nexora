"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";
import { fieldClassName } from "@/components/ui/input-field";
import { useWorkspace } from "@/features/demo/hooks/use-workspace";
import { conversationStatuses } from "@/features/demo/schemas/workspace-schema";
import { QueryState } from "@/features/demo/components/query-state";
import { ListToolbar } from "@/features/demo/components/list-toolbar";
import { StatusBadge } from "@/features/demo/components/status-badge";
import { ConversationPanel } from "./conversation-panel";

export function ConversationsScreen() {
  const t = useTranslations("Conversations");
  const common = useTranslations("Demo");
  const query = useWorkspace();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const clients = new Map(query.data?.clients.map((client) => [client.id, client]));
  const conversations = (query.data?.conversations ?? []).filter(
    (conversation) =>
      `${clients.get(conversation.clientId)?.name ?? ""} ${clients.get(conversation.clientId)?.phone ?? ""} ${conversation.messages.at(-1)?.body ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "all" || conversation.status === status),
  );
  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];
  return (
    <div className="space-y-5">
      <ListToolbar search={search} onSearch={setSearch} count={conversations.length}>
        <label className="space-y-2 text-xs">
          <span className="block">{common("statusLabel")}</span>
          <select
            className={fieldClassName}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">{common("all")}</option>
            {conversationStatuses.map((value) => (
              <option key={value} value={value}>
                {common(`status.${value}`)}
              </option>
            ))}
          </select>
        </label>
      </ListToolbar>
      <QueryState
        pending={query.isPending}
        error={query.isError}
        empty={!conversations.length}
        retry={() => {
          void query.refetch();
        }}
      >
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
                      selected?.id === conversation.id ? "bg-secondary/60" : "",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-xs font-medium">
                        {clients.get(conversation.clientId)?.name}
                      </span>
                      <StatusBadge status={conversation.status} />
                    </div>
                    <p className="mt-3 line-clamp-2 break-words text-xs leading-5 text-muted-foreground">
                      {conversation.messages.at(-1)?.body}
                    </p>
                    <span className="mt-3 block text-xs text-muted-foreground">
                      {common(`status.${conversation.assignedTo}`)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          {selected ? (
            <ConversationPanel
              key={selected.id}
              conversation={selected}
              client={clients.get(selected.clientId)}
              orders={(query.data?.orders ?? []).filter(
                (order) => order.clientId === selected.clientId,
              )}
            />
          ) : null}
        </div>
      </QueryState>
    </div>
  );
}
