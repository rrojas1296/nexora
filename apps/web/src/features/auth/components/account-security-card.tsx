"use client";

import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function AccountSecurityCard() {
  const t = useTranslations("Settings");
  const password = useTranslations("PasswordChange");
  return (
    <section className="flex flex-wrap items-center justify-between gap-5 rounded-3xl border bg-card p-6">
      <div className="max-w-2xl">
        <h2 className="text-lg">{t("security")}</h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{t("securityHint")}</p>
      </div>
      <Link
        href="/settings/password"
        className="inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <KeyRound className="size-4" aria-hidden="true" />
        {password("title")}
      </Link>
    </section>
  );
}
