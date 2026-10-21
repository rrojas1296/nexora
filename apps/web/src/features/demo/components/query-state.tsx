"use client";

import { LoaderCircle, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageEntrance } from "@/components/ui/page-entrance";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

type Props = {
  pending: boolean;
  error: boolean;
  errorMessage?: string;
  empty?: boolean;
  retry: () => void;
  children: ReactNode;
};
export function QueryState({ pending, error, errorMessage, empty, retry, children }: Props) {
  const t = useTranslations("Demo");
  if (pending)
    return (
      <output className="flex min-h-48 items-center justify-center gap-3 rounded-3xl border bg-card p-8 text-sm text-muted-foreground">
        <LoaderCircle
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        {t("loading")}
      </output>
    );
  if (error)
    return (
      <section className="rounded-3xl border bg-card p-8">
        <h2 className="text-lg">{t("loadError")}</h2>
        <p role="alert" className="mt-2 text-sm text-muted-foreground">
          {errorMessage ?? t("loadErrorHint")}
        </p>
        <Button variant="outline" className="mt-5" onClick={retry}>
          <RefreshCw className="size-4" aria-hidden="true" />
          {t("retry")}
        </Button>
      </section>
    );
  if (empty)
    return (
      <section className="rounded-3xl border border-dashed bg-card/60 px-6 py-12 text-center">
        <h2 className="text-lg">{t("empty")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("emptyHint")}</p>
      </section>
    );
  return <PageEntrance nested>{children}</PageEntrance>;
}
