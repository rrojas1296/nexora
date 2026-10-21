"use client";

import { ArrowUpRight } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { defaultCurrency } from "@/lib/config/currency";
import type { ProductSummary } from "../schemas/product-schema";

export function ProductKpis({ summary }: { summary?: ProductSummary }) {
  const t = useTranslations("ResourceKpis");
  const format = useFormatter();
  const keys = ["catalog", "available", "lowStock", "inventoryValue"] as const;
  return (
    <section aria-label={t("title")} className="space-y-2">
      <p className="text-xs text-muted-foreground">{t("scope")}</p>
      <dl className="grid gap-px overflow-hidden rounded-3xl border bg-border sm:grid-cols-2 xl:grid-cols-4">
        {keys.map((key) => (
          <div key={key} className="bg-card p-5">
            <dt className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              {t(key)}
              <ArrowUpRight className="size-4 text-primary" aria-hidden="true" />
            </dt>
            <dd className="mt-4 text-3xl tracking-tight tabular-nums">
              {summary
                ? format.number(
                    summary[key],
                    key === "inventoryValue"
                      ? { style: "currency", currency: defaultCurrency }
                      : undefined,
                  )
                : "—"}
            </dd>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{t(`${key}Hint`)}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
