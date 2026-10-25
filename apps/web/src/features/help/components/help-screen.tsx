"use client";

import { useState } from "react";
import { BookOpen, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ListToolbar } from "@/features/demo/components/list-toolbar";

const articles = [
  "start",
  "messages",
  "agent",
  "catalog",
  "orders",
  "privacy",
  "businesses",
  "reset",
] as const;
export function HelpScreen() {
  const t = useTranslations("Help");
  const [search, setSearch] = useState("");
  const filtered = articles.filter((key) =>
    `${t(`articles.${key}.title`)} ${t(`articles.${key}.body`)}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-3xl border bg-secondary/30 p-6">
        <div>
          <BookOpen className="mb-4 size-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-xl">{t("intro")}</h2>
          <p className="mt-2 max-w-lg text-xs leading-6 text-muted-foreground">{t("introHint")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/onboarding">{t("setup")}</Link>
        </Button>
      </section>
      <ListToolbar search={search} onSearch={setSearch} count={filtered.length} />
      <section aria-label={t("faq")} className="space-y-3">
        {filtered.map((key) => (
          <details key={key} className="group rounded-2xl border bg-card p-5">
            <summary className="cursor-pointer text-sm font-medium">
              {t(`articles.${key}.title`)}
            </summary>
            <p className="mt-4 max-w-3xl whitespace-pre-wrap text-xs leading-7 text-muted-foreground">
              {t(`articles.${key}.body`)}
            </p>
          </details>
        ))}
      </section>
      {!filtered.length ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-xs text-muted-foreground">
          {t("noResults")}
        </p>
      ) : null}
      <section className="rounded-3xl border p-6">
        <h2 className="text-sm">{t("resources")}</h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{t("resourcesHint")}</p>
        <Button variant="ghost" asChild className="mt-4">
          <a
            href="https://developers.facebook.com/docs/whatsapp/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("whatsappDocs")}
            <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only">{t("newTab")}</span>
          </a>
        </Button>
      </section>
    </div>
  );
}
