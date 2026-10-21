"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function PasswordChangedNotice() {
  const searchParams = useSearchParams();
  const t = useTranslations("PasswordChange");
  if (searchParams.get("passwordChanged") !== "1") return null;
  return (
    <output className="block rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs leading-6 text-foreground">
      {t("success")}
    </output>
  );
}
