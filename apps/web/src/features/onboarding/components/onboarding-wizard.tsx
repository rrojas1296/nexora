"use client";

import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useOnboardingForm } from "../hooks/use-onboarding-form";
import { onboardingSteps } from "../types/onboarding-steps";
import { OnboardingFields } from "./onboarding-fields";
import { OnboardingSummary } from "./onboarding-summary";
import { WhatsappPreview } from "./whatsapp-preview";

export function OnboardingWizard() {
  const t = useTranslations("Onboarding");
  const { form, step, setStep, next, finish, simulateFailure, setSimulateFailure } =
    useOnboardingForm();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const current = onboardingSteps[step] ?? onboardingSteps[0];
  const isLast = step === onboardingSteps.length - 1;
  const { isSubmitting, errors } = form.formState;
  const whatsappPreview = useWatch({ control: form.control, name: "whatsappPreview" });
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <aside className="shrink-0 lg:w-60">
        <p className="text-xs text-muted-foreground">
          {t("progress", { step: step + 1, total: onboardingSteps.length })}
        </p>
        <progress
          value={step + 1}
          max={onboardingSteps.length}
          aria-label={t("progressLabel")}
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full accent-primary"
        />
        <ol className="mt-7 space-y-3">
          {onboardingSteps.map((item, index) => (
            <li
              key={item.key}
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-3 text-xs text-muted-foreground",
                index === step && "text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs",
                  index === step && "border-primary bg-primary text-primary-foreground",
                  index < step && "border-transparent bg-secondary text-secondary-foreground",
                )}
              >
                {index < step ? <Check className="size-3" aria-hidden="true" /> : index + 1}
              </span>
              {t(`steps.${item.key}.title`)}
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-xs text-xs leading-6 text-muted-foreground">{t("temporary")}</p>
      </aside>
      <section className="min-w-0 flex-1 rounded-3xl border bg-card p-5 sm:p-8">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-normal tracking-tight outline-none"
        >
          {t(`steps.${current.key}.title`)}
        </h2>
        <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
          {t(`steps.${current.key}.description`)}
        </p>
        <form
          noValidate
          aria-busy={isSubmitting}
          onSubmit={(event) => {
            if (isLast) {
              void finish(event);
            } else {
              event.preventDefault();
              void next();
            }
          }}
        >
          <fieldset disabled={isSubmitting}>
            <legend className="sr-only">{t(`steps.${current.key}.title`)}</legend>
            {isLast ? (
              <OnboardingSummary values={form.getValues()} onEdit={setStep} />
            ) : (
              <OnboardingFields fields={current.fields} form={form} />
            )}
            {current.key === "whatsapp" ? (
              <WhatsappPreview
                simulated={whatsappPreview}
                onChange={(value) => form.setValue("whatsappPreview", value, { shouldDirty: true })}
              />
            ) : null}
            {isLast ? (
              <>
                <p className="mt-5 text-xs leading-6 text-muted-foreground">{t("finishNotice")}</p>
                <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(event) => setSimulateFailure(event.target.checked)}
                    className="mt-0.5 size-4 accent-primary"
                  />
                  {t("simulateFailure")}
                </label>
              </>
            ) : null}
            {errors.root ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-destructive/30 p-3 text-xs leading-5 text-destructive"
              >
                {errors.root.message}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <Button
                type="button"
                variant="outline"
                disabled={step === 0 || isSubmitting}
                onClick={() => {
                  form.clearErrors("root");
                  setStep(step - 1);
                }}
              >
                <ArrowLeft aria-hidden="true" />
                {t("back")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {t(
                  isSubmitting
                    ? "saving"
                    : isLast
                      ? "finish"
                      : current.key === "whatsapp"
                        ? "review"
                        : "next",
                )}
                {isSubmitting ? (
                  <LoaderCircle
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                ) : (
                  <ArrowRight aria-hidden="true" />
                )}
              </Button>
            </div>
          </fieldset>
        </form>
      </section>
    </div>
  );
}
