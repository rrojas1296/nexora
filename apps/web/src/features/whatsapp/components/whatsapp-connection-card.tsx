"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "@/features/auth/hooks/use-session";
import { WhatsappConnectionPanel } from "./whatsapp-connection-panel";

export function WhatsappConnectionCard() {
  const t = useTranslations("WhatsappConnection");
  const { data: session } = useSession();
  if (!session) return null;
  const membership = session.memberships.find(
    (entry) => entry.businessId === session.activeBusinessId,
  );
  const canWrite = membership?.role === "OWNER" || membership?.role === "ADMIN";
  return (
    <section className="rounded-3xl border bg-card p-6" aria-labelledby="whatsapp-heading">
      <h2 id="whatsapp-heading" className="text-lg">
        {t("title")}
      </h2>
      <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">{t("description")}</p>
      {canWrite ? (
        <Suspense fallback={<p className="mt-4 text-sm text-muted-foreground">{t("loading")}</p>}>
          <WhatsappConnectionPanel
            key={`${session.user.id}:${session.activeBusinessId}:${membership.role}`}
            scope={{ userId: session.user.id, businessId: session.activeBusinessId }}
          />
        </Suspense>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">{t("ownerOnly")}</p>
      )}
    </section>
  );
}
