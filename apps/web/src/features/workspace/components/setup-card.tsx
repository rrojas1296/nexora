"use client";

import { ArrowUpRight, Check, Sprout } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOnboardingStore } from "@/features/onboarding/stores/onboarding-store";
import { Link } from "@/i18n/navigation";

export function SetupCard() {
  const t = useTranslations("Onboarding");
  const completed = useOnboardingStore((state) => state.completed);
  const businessName = useOnboardingStore((state) => state.draft.businessName);
  return (
    <section className="flex-1 rounded-3xl border bg-card/70 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-normal tracking-tight">
          {t(completed ? "completedTitle" : "cardTitle")}
        </h2>
        {completed ? (
          <Check className="size-5 text-primary" aria-hidden="true" />
        ) : (
          <Sprout className="size-5 text-primary" strokeWidth={1.4} aria-hidden="true" />
        )}
      </div>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">
        {completed ? t("completedDescription", { business: businessName }) : t("cardDescription")}
      </p>
      <p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">
        {t("finishNotice")}
      </p>
      <Link
        href="/onboarding"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-highlight px-4 py-2.5 text-xs font-medium text-highlight-foreground outline-none transition-colors hover:bg-highlight/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:transition-none"
      >
        {t(completed ? "editSetup" : "startSetup")}
        <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}
