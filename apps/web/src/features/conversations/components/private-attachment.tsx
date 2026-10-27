"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { InboxScope } from "../schemas/inbox-schema";
import { inboxService } from "../services/inbox-service";

export function PrivateAttachment({
  scope,
  threadId,
  messageId,
}: {
  scope: InboxScope;
  threadId: string;
  messageId: string;
}) {
  const t = useTranslations("ConversationCommerce");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function download() {
    if (controller.current && !controller.current.signal.aborted && state === "loading") return;
    const current = new AbortController();
    controller.current = current;
    setState("loading");
    try {
      const blob = await inboxService.media(scope, threadId, messageId, current.signal);
      current.signal.throwIfAborted();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = blob.type === "application/pdf" ? "attachment.pdf" : "attachment.webp";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState("idle");
    } catch {
      if (!current.signal.aborted) setState("error");
    }
  }
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        disabled={state === "loading"}
        onClick={() => void download()}
      >
        <Download className="size-4" aria-hidden="true" />
        {t(state === "loading" ? "downloading" : "download")}
      </Button>
      {state === "error" ? (
        <p role="alert" className="text-xs text-destructive">
          {t("downloadError")}
        </p>
      ) : null}
    </div>
  );
}
