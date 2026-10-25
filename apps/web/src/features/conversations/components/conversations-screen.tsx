"use client";

import { useTranslations } from "next-intl";
import { useSession } from "@/features/auth/hooks/use-session";
import { InboxConversations } from "./inbox-conversations";

export function ConversationsScreen() {
  const t = useTranslations("WhatsappInbox");
  const session = useSession();
  if (session.isPending) return <p className="text-sm text-muted-foreground">{t("loading")}</p>;
  if (session.isError || !session.data?.activeBusinessId)
    return (
      <p role="alert" className="text-sm text-destructive">
        {t("sessionError")}
      </p>
    );
  const scope = { userId: session.data.user.id, businessId: session.data.activeBusinessId };
  return <InboxConversations key={`${scope.userId}:${scope.businessId}`} scope={scope} />;
}
