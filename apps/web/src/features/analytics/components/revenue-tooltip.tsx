"use client";

import { useFormatter, useTranslations } from "next-intl";

export function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly { value?: unknown }[];
  label?: unknown;
}) {
  const t = useTranslations("Analytics");
  const format = useFormatter();
  const value = payload?.[0]?.value;
  if (!active || typeof value !== "number" || typeof label !== "string") return null;
  return (
    <div className="rounded-xl border bg-popover p-3 text-xs text-popover-foreground shadow-md">
      <p>
        {format.dateTime(new Date(`${label}T12:00:00Z`), { dateStyle: "medium", timeZone: "UTC" })}
      </p>
      <p className="mt-2 text-primary">
        {t("revenue")}: {format.number(value, { style: "currency", currency: "USD" })}
      </p>
    </div>
  );
}
