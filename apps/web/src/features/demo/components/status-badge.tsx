"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

type Status =
  | "pending"
  | "paid"
  | "shipped"
  | "cancelled"
  | "open"
  | "closed"
  | "active"
  | "inactive"
  | "agent"
  | "human";
export function StatusBadge({ status }: { status: Status }) {
  const t = useTranslations("Demo.status");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs",
        ["paid", "shipped", "active", "open"].includes(status)
          ? "bg-accent text-accent-foreground"
          : ["pending", "agent"].includes(status)
            ? "bg-secondary text-secondary-foreground"
            : "bg-muted text-muted-foreground",
      )}
    >
      {t(status)}
    </span>
  );
}
