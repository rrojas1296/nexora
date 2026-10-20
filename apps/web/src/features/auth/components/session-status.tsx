"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function SessionStatus({ failed = false, retry }: { failed?: boolean; retry?: () => void }) {
  const t = useTranslations("Auth");
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
      aria-busy={!failed}
    >
      {failed ? null : (
        <LoaderCircle
          className="size-6 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      )}
      <p role={failed ? "alert" : "status"} className="max-w-md text-sm text-muted-foreground">
        {t(failed ? "sessionError" : "checkingSession")}
      </p>
      {failed ? (
        <div className="flex flex-wrap justify-center gap-3">
          {retry ? <Button onClick={retry}>{t("retry")}</Button> : null}
          <Link
            href="/login"
            className="rounded-full border px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t("loginAction")}
          </Link>
        </div>
      ) : null}
    </main>
  );
}
