"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useInboxSend } from "../hooks/use-inbox-send";
import {
  sendTextSchema,
  type InboxReply,
  type InboxScope,
  type InboxTextValues,
} from "../schemas/inbox-schema";
import { inboxSendErrorKey } from "../services/inbox-send-error";

export function ConversationComposer({
  scope,
  threadId,
  reply,
  onShowLatest,
}: {
  scope: InboxScope;
  threadId: string;
  reply: InboxReply | undefined;
  onShowLatest: () => void;
}) {
  const t = useTranslations("WhatsappInbox");
  const id = useId();
  const form = useForm<InboxTextValues>({
    resolver: zodResolver(sendTextSchema),
    defaultValues: { body: "" },
  });
  const { field: bodyField } = useController({ name: "body", control: form.control });
  const send = useInboxSend(scope, threadId);
  const status = send.tracked?.result?.status;
  const [expiredWindow, setExpiredWindow] = useState<string | null>(null);
  const windowExpiresAt = reply?.windowExpiresAt;
  useEffect(() => {
    if (!windowExpiresAt) return;
    const timer = setTimeout(
      () => setExpiredWindow(windowExpiresAt),
      Math.max(0, Date.parse(windowExpiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [windowExpiresAt]);
  const expired = !!windowExpiresAt && expiredWindow === windowExpiresAt;
  const allowed = reply?.allowed && !expired;
  const busy = send.isPending || form.formState.isSubmitting;
  const blocked = !allowed || busy || !!send.tracked;
  const hint = !reply
    ? "checking"
    : expired && reply.reason === "allowed"
      ? "windowClosed"
      : reply.reason;

  return (
    <div className="space-y-3 border-t p-5">
      <p id={`${id}-hint`} className="text-xs leading-6 text-muted-foreground">
        {t(`replyHints.${hint}`)}
      </p>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit(async ({ body }) => {
          if (!allowed || blocked) return;
          onShowLatest();
          await send.submit(body);
        })}
      >
        <label htmlFor={id} className="block text-xs font-medium">
          {t("composeLabel")}
        </label>
        <textarea
          {...bodyField}
          id={id}
          rows={3}
          maxLength={4096}
          readOnly={blocked}
          aria-disabled={blocked}
          aria-invalid={!!form.formState.errors.body}
          aria-describedby={`${id}-hint ${id}-error`}
          placeholder={t("composePlaceholder")}
          className="w-full resize-y rounded-2xl border bg-background px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary read-only:cursor-not-allowed read-only:opacity-60"
        />
        <p id={`${id}-error`} className="text-xs text-destructive">
          {form.formState.errors.body ? t("invalidText") : null}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{t("textOnly")}</p>
          <Button type="submit" size="sm" disabled={blocked}>
            <Send className="size-4" aria-hidden="true" />
            {busy ? t("sending") : t("send")}
          </Button>
        </div>
      </form>
      {send.tracked ? (
        <div className="space-y-3 rounded-2xl border p-4">
          <output aria-live="polite" className="block text-xs leading-6">
            {send.isPending
              ? t("checkingSend")
              : status
                ? t(`sendResults.${status}`)
                : t(`sendErrors.${inboxSendErrorKey(send.error)}`)}
          </output>
          <p className="break-all text-xs text-muted-foreground">
            {t("sendReference", { key: send.tracked.key })}
          </p>
          {send.tracked.result?.providerErrorCode != null ? (
            <p className="text-xs text-destructive">
              {t("metaError", { code: send.tracked.result.providerErrorCode })}
            </p>
          ) : null}
          {send.reconcileError ? (
            <p role="alert" className="text-xs text-destructive">
              {t("reconcileError")}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {status !== "ACCEPTED" && status !== "REJECTED" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={send.checkStatus}
              >
                {t("checkSend")}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                send.newMessage();
                form.reset({ body: "" });
              }}
            >
              {t("newMessage")}
            </Button>
          </div>
          {!status || status === "PENDING" || status === "UNKNOWN" ? (
            <p className="text-xs leading-6 text-muted-foreground">{t("noBlindRetry")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
