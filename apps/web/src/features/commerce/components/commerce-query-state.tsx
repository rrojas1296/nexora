"use client";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
export function CommerceQueryState({
  pending,
  error,
  empty = false,
  retry,
  children,
}: {
  pending: boolean;
  error: boolean;
  empty?: boolean;
  retry: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("Commerce");
  if (pending)
    return (
      <output className="block rounded-2xl border p-6 text-sm text-muted-foreground">
        {t("loading")}
      </output>
    );
  if (error)
    return (
      <div role="alert" className="space-y-3 rounded-2xl border p-6">
        <p className="text-sm">{t("loadError")}</p>
        <p className="text-xs text-muted-foreground">{t("loadErrorHint")}</p>
        <Button variant="outline" onClick={retry}>
          {t("retry")}
        </Button>
      </div>
    );
  if (empty)
    return <p className="rounded-2xl border p-6 text-sm text-muted-foreground">{t("empty")}</p>;
  return children;
}
