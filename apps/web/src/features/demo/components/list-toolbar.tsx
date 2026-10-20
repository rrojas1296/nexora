"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { fieldClassName } from "@/components/ui/input-field";

export function ListToolbar({
  search,
  onSearch,
  count,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  count: number;
  children?: ReactNode;
}) {
  const t = useTranslations("Demo");
  const id = useId();
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-48 flex-1 sm:max-w-sm">
        <label htmlFor={id} className="mb-2 block text-xs">
          {t("search")}
        </label>
        <input
          id={id}
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={t("searchPlaceholder")}
          className={fieldClassName}
          maxLength={100}
        />
      </div>
      {children}
      <output className="py-2 text-xs text-muted-foreground">{t("results", { count })}</output>
    </div>
  );
}
