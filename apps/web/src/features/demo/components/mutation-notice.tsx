"use client";

import { useTranslations } from "next-intl";
import { DemoDataError } from "../services/workspace-service";

export function MutationNotice({
  error,
  success,
  pending,
  message,
}: {
  error: Error | null;
  success?: boolean;
  pending?: boolean;
  message?: string;
}) {
  const t = useTranslations("Demo");
  if (pending)
    return <output className="mt-4 block text-xs text-muted-foreground">{t("saving")}</output>;
  if (error)
    return (
      <p
        role="alert"
        className="mt-4 rounded-xl border border-destructive/30 p-3 text-xs leading-6 text-destructive"
      >
        {message ?? t(`errors.${error instanceof DemoDataError ? error.code : "unexpected"}`)}
      </p>
    );
  if (success) return <output className="mt-4 block text-xs text-primary">{t("saved")}</output>;
  return null;
}
