"use client";

import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/features/auth/hooks/use-session";

export function SetupCard() {
  const t = useTranslations("Businesses");
  const { data: session } = useSession();
  const business = session?.memberships.find(
    (entry) => entry.businessId === session.activeBusinessId,
  )?.business;
  return (
    <section className="flex-1 rounded-3xl border bg-card/70 p-5 sm:p-6">
      <Building2 className="size-5 text-primary" aria-hidden="true" />
      <h2 className="mt-4 text-lg">{business?.name ?? t("title")}</h2>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">{t("setupHint")}</p>
      <Link
        href="/businesses/configuration"
        className="mt-5 inline-flex rounded-full bg-secondary px-4 py-2.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("configuration")}
      </Link>
    </section>
  );
}
