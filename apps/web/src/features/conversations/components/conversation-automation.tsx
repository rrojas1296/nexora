"use client";

import { Bot, Hand } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useConversationControl } from "../hooks/use-conversation-control";
import type { InboxAutomation, InboxScope } from "../schemas/inbox-schema";

export function ConversationAutomation({
  scope,
  threadId,
  automation,
  refreshing,
}: {
  scope: InboxScope;
  threadId: string;
  automation: InboxAutomation | undefined;
  refreshing: boolean;
}) {
  const t = useTranslations("WhatsappInbox.automation");
  const mutation = useConversationControl(scope, threadId);
  if (!automation)
    return <p className="border-b p-5 text-xs text-muted-foreground">{t("checking")}</p>;
  const human = automation.mode === "HUMAN";
  return (
    <div className="space-y-3 border-b p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          {human ? (
            <Hand className="size-4" aria-hidden="true" />
          ) : (
            <Bot className="size-4" aria-hidden="true" />
          )}
          {t(human ? "human" : "ai")}
        </p>
        {automation.canManage ? (
          <Button
            type="button"
            size="sm"
            variant={human ? "outline" : "default"}
            disabled={mutation.isPending || refreshing || (human && !automation.ready)}
            onClick={() => {
              if (!window.confirm(t(human ? "resumeConfirm" : "takeoverConfirm"))) return;
              mutation.mutate({ mode: human ? "AI" : "HUMAN", version: automation.version });
            }}
          >
            {mutation.isPending ? t("changing") : t(human ? "resume" : "takeover")}
          </Button>
        ) : null}
      </div>
      <p className="text-xs leading-6 text-muted-foreground">{t(human ? "humanHint" : "aiHint")}</p>
      {!automation.configured ? (
        <p className="text-xs text-muted-foreground">{t("notConfigured")}</p>
      ) : !automation.ready ? (
        <p className="text-xs text-muted-foreground">{t("notReady")}</p>
      ) : null}
      {automation.lastJob ? (
        <output className="block text-xs leading-6 text-muted-foreground">
          {t("jobLabel")} {t(`jobs.${automation.lastJob.status}`)}
          {automation.lastJob.reason === "RATE_LIMIT" ? ` ${t("rateLimit")}` : null}
        </output>
      ) : null}
      {automation.inFlight || automation.lastJob?.status === "UNKNOWN" ? (
        <output className="block text-xs leading-6 text-muted-foreground">{t("uncertain")}</output>
      ) : null}
      {mutation.isError ? (
        <p role="alert" className="text-xs leading-6 text-destructive">
          {t("error")}
        </p>
      ) : null}
    </div>
  );
}
