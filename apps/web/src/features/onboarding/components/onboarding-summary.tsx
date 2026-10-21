"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { OnboardingValues } from "../schemas/onboarding-schema";
import { onboardingSteps } from "../types/onboarding-steps";

export function OnboardingSummary({
  values,
  onEdit,
}: {
  values: OnboardingValues;
  onEdit: (step: number) => void;
}) {
  const t = useTranslations("Onboarding");
  return (
    <div className="space-y-3">
      {onboardingSteps.slice(0, 4).map((step, index) => (
        <section key={step.key} className="rounded-2xl border bg-background/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm">{t(`steps.${step.key}.title`)}</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(index)}
              aria-label={t("editSection", { section: t(`steps.${step.key}.title`) })}
            >
              <Pencil className="size-3" aria-hidden="true" />
              {t("edit")}
            </Button>
          </div>
          <dl className="space-y-2">
            {step.fields
              .filter((field) => field !== "whatsappPreview")
              .map((field) => (
                <div key={field} className="grid gap-1 text-xs sm:grid-cols-2">
                  <dt className="text-muted-foreground">{t(`fields.${field}`)}</dt>
                  <dd className="min-w-0 break-words whitespace-pre-wrap">
                    {field === "agentTone"
                      ? t(`tones.${values.agentTone}`)
                      : field === "whatsappCountry"
                        ? t(`countries.${values.whatsappCountry}`)
                        : field === "timezone"
                          ? `${t(`timezones.${values.timezone}`)} · ${values.timezone}`
                          : String(values[field] || t("notProvided"))}
                  </dd>
                </div>
              ))}
          </dl>
          {step.key === "whatsapp" ? (
            <p className="mt-3 text-xs text-secondary-foreground">
              {t(values.whatsappPreview ? "previewReady" : "notConnected")}
            </p>
          ) : null}
        </section>
      ))}
    </div>
  );
}
