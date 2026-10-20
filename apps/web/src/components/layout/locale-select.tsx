"use client";

import { useTransition } from "react";
import { hasLocale, useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { SelectField } from "@/components/ui/select-field";

export function LocaleSelect() {
  const locale = useLocale();
  const t = useTranslations("Common");
  const labels = useTranslations("Locale");
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <SelectField
        aria-label={t("language")}
        value={locale}
        disabled={pending}
        aria-busy={pending}
        onValueChange={(nextLocale) => {
          if (hasLocale(routing.locales, nextLocale)) {
            const search = window.location.search;
            const hash = window.location.hash;
            startTransition(() =>
              router.replace(`${pathname}${search}${hash}`, { locale: nextLocale, scroll: false }),
            );
          }
        }}
        size="sm"
        className="w-fit max-w-36 rounded-full bg-card/60 text-xs"
        options={routing.locales.map((value) => ({ value, label: labels(value) }))}
      />
      <output className="sr-only" aria-live="polite">
        {pending ? labels("changing") : ""}
      </output>
    </div>
  );
}
