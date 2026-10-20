"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  const t = useTranslations("Demo");
  if (pages < 2) return null;
  return (
    <nav aria-label={t("pagination")} className="flex items-center justify-end gap-3">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t("previous")}
      </Button>
      <span className="text-xs text-muted-foreground">{t("page", { page, pages })}</span>
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        {t("next")}
      </Button>
    </nav>
  );
}
