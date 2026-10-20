"use client";

import { ArrowUpRight, CalendarDays, ChartNoAxesCombined } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import { Link } from "@/i18n/navigation";

export function DashboardToolbar({
  year,
  years,
  onYearChange,
}: {
  year: number;
  years: number[];
  onYearChange: (year: number) => void;
}) {
  const t = useTranslations("Dashboard");
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card px-4 py-3 sm:px-5">
      <div className="flex items-center gap-3">
        <CalendarDays className="hidden size-4 text-muted-foreground sm:block" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">{t("overview")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("yearScope", { year })}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SelectField
          aria-label={t("year")}
          size="sm"
          className="w-24"
          value={String(year)}
          onValueChange={(value) => onYearChange(Number(value))}
          options={years.map((value) => ({ value: String(value), label: value }))}
        />
        <Button asChild variant="outline" size="sm">
          <Link href="/reports">
            <ChartNoAxesCombined className="size-4" aria-hidden="true" />
            {t("viewReports")}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
