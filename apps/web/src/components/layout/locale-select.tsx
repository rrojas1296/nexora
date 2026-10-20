"use client";

import { useTransition } from "react";
import { hasLocale, useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSelect() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const labels = useTranslations("Locale");
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="sr-only">{t("language")}</span>
      <select
        value={locale}
        disabled={pending}
        aria-busy={pending}
        onChange={(event) => {
          const nextLocale = event.target.value;
          if (hasLocale(routing.locales, nextLocale)) {
            const search = window.location.search;
            const hash = window.location.hash;
            startTransition(() =>
              router.replace(`${pathname}${search}${hash}`, { locale: nextLocale, scroll: false }),
            );
          }
        }}
        className="h-8 max-w-28 rounded-full border border-border bg-card/60 px-3 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {routing.locales.map((value) => (
          <option key={value} value={value}>
            {labels(value)}
          </option>
        ))}
      </select>
      <output className="sr-only" aria-live="polite">
        {pending ? labels("changing") : ""}
      </output>
    </label>
  );
}
