"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { InboxMessage, InboxScope } from "../schemas/inbox-schema";
import { PrivateAttachment } from "./private-attachment";

export function ConversationAttachment({
  scope,
  threadId,
  message,
}: {
  scope: InboxScope;
  threadId: string;
  message: InboxMessage;
}) {
  const t = useTranslations("ConversationCommerce");
  if (message.direction !== "INBOUND") return null;
  if (message.location)
    return (
      <div className="my-2 space-y-1 text-xs leading-6">
        <p className="flex items-center gap-2 font-medium">
          <MapPin className="size-4" aria-hidden="true" />
          {t("location")}
        </p>
        {message.location.name ? <p className="break-words">{message.location.name}</p> : null}
        {message.location.address ? (
          <p className="break-words">{message.location.address}</p>
        ) : null}
        <p dir="ltr">
          {message.location.latitude}, {message.location.longitude}
        </p>
        <p className="text-muted-foreground">{t("locationHint")}</p>
      </div>
    );
  if (!["image", "document"].includes(message.type)) return null;
  return (
    <div className="my-2 space-y-2">
      <p className="text-xs text-muted-foreground">{t(`media.${message.mediaStatus}`)}</p>
      {message.mediaStatus === "READY" ? (
        <PrivateAttachment scope={scope} threadId={threadId} messageId={message.id} />
      ) : null}
    </div>
  );
}
