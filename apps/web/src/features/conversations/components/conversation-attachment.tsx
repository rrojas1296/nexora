"use client";

import { DeliveryAddressCard } from "@/features/orders/components/delivery-address-card";
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
  const d = useTranslations("Delivery");
  if (message.direction !== "INBOUND") return null;
  if (message.location)
    return (
      <div className="my-2">
        <DeliveryAddressCard
          title={d("sharedLocation")}
          address={message.location.address || message.location.name || ""}
          reference={message.location.address ? (message.location.name ?? "") : ""}
          latitude={message.location.latitude}
          longitude={message.location.longitude}
        >
          <p className="text-xs leading-6 text-muted-foreground">{t("locationHint")}</p>
        </DeliveryAddressCard>
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
