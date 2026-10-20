"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormatter, useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input-field";
import { cn } from "@/lib/utils/cn";
import { useWorkspaceMutation } from "@/features/demo/hooks/use-workspace";
import { useValidationMessage } from "@/features/demo/hooks/use-validation-message";
import { messageInputSchema, conversationStatuses } from "@/features/demo/schemas/workspace-schema";
import type { Client, Conversation, Order } from "@/features/demo/types/workspace";
import { MutationNotice } from "@/features/demo/components/mutation-notice";

export function ConversationPanel({
  conversation,
  client,
  orders,
}: {
  conversation: Conversation;
  client?: Client;
  orders: readonly Order[];
}) {
  const t = useTranslations("Conversations");
  const common = useTranslations("Demo");
  const format = useFormatter();
  const validationMessage = useValidationMessage();
  const mutation = useWorkspaceMutation();
  const form = useForm<{ body: string }>({
    resolver: zodResolver(messageInputSchema),
    defaultValues: { body: "" },
  });
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [conversation.messages.length]);
  return (
    <section aria-label={t("chat")} className="min-w-0 rounded-3xl border bg-card xl:col-span-3">
      <div className="border-b p-5">
        <h2 className="text-lg">{client?.name ?? "—"}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {client?.phone} · {t("ordersCount", { count: orders.length })}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-2 text-xs">
            <span className="block">{common("statusLabel")}</span>
            <select
              className={fieldClassName}
              value={conversation.status}
              disabled={mutation.isPending}
              onChange={(event) => {
                const status = conversationStatuses.find((value) => value === event.target.value);
                if (status)
                  mutation.mutate({
                    type: "conversation.update",
                    id: conversation.id,
                    status,
                    assignedTo: conversation.assignedTo,
                  });
              }}
            >
              {conversationStatuses.map((status) => (
                <option key={status} value={status}>
                  {common(`status.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-xs">
            <span className="block">{t("assignedTo")}</span>
            <select
              className={fieldClassName}
              value={conversation.assignedTo}
              disabled={mutation.isPending}
              onChange={(event) => {
                const assignedTo = event.target.value;
                if (assignedTo === "agent" || assignedTo === "human")
                  mutation.mutate({
                    type: "conversation.update",
                    id: conversation.id,
                    status: conversation.status,
                    assignedTo,
                  });
              }}
            >
              <option value="agent">{common("status.agent")}</option>
              <option value="human">{common("status.human")}</option>
            </select>
          </label>
        </div>
      </div>
      <div
        ref={logRef}
        role="log"
        aria-label={t("messages")}
        aria-live="polite"
        aria-relevant="additions"
        className="flex h-80 flex-col gap-4 overflow-y-auto overscroll-contain p-5"
      >
        {conversation.messages.map((message) => (
          <article
            key={message.id}
            className={cn(
              "max-w-9/10 rounded-2xl px-4 py-3",
              message.author === "team"
                ? "self-end bg-accent text-accent-foreground"
                : "self-start bg-secondary",
            )}
          >
            <p className="mb-1 text-xs text-muted-foreground">
              {message.author === "team" ? t("team") : client?.name}
            </p>
            <p className="whitespace-pre-wrap break-words text-xs leading-6">{message.body}</p>
            <time dateTime={message.createdAt} className="mt-2 block text-xs text-muted-foreground">
              {format.dateTime(new Date(message.createdAt), {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "UTC",
              })}{" "}
              UTC
            </time>
          </article>
        ))}
      </div>
      <div className="border-t p-5">
        <p className="mb-3 text-xs leading-5 text-muted-foreground">
          {t(conversation.status === "closed" ? "closedHint" : "sendHint")}
        </p>
        <form
          method="post"
          noValidate
          onSubmit={form.handleSubmit(async (input) => {
            try {
              await mutation.mutateAsync({ type: "message.send", id: conversation.id, input });
              form.reset();
            } catch {
              /* Preserve the message draft on error. */
            }
          })}
        >
          <label htmlFor="message-body" className="sr-only">
            {t("message")}
          </label>
          <textarea
            id="message-body"
            {...form.register("body")}
            disabled={mutation.isPending || conversation.status === "closed"}
            rows={2}
            maxLength={2000}
            placeholder={t("message")}
            aria-invalid={Boolean(form.formState.errors.body)}
            aria-describedby={form.formState.errors.body ? "message-error" : undefined}
            className={fieldClassName}
          />
          {form.formState.errors.body ? (
            <p id="message-error" className="mt-2 text-xs text-destructive">
              {validationMessage(form.formState.errors.body)}
            </p>
          ) : null}
          <div className="mt-3 flex justify-end">
            <Button type="submit" disabled={mutation.isPending || conversation.status === "closed"}>
              <Send className="size-3.5" aria-hidden="true" />
              {t(mutation.isPending ? "sending" : "send")}
            </Button>
          </div>
        </form>
        <MutationNotice error={mutation.error} pending={mutation.isPending} />
      </div>
    </section>
  );
}
