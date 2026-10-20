"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { InputField, fieldClassName } from "@/components/ui/input-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import {
  agentTones,
  currencies,
  timezones,
  type OnboardingValues,
} from "../schemas/onboarding-schema";

type Props = { fields: readonly (keyof OnboardingValues)[]; form: UseFormReturn<OnboardingValues> };

export function OnboardingFields({ fields, form }: Props) {
  const t = useTranslations("Onboarding");
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {fields
        .filter((field) => field !== "whatsappPreview")
        .map((field) => {
          const error = form.formState.errors[field]?.message;
          const id = `onboarding-${field}`;
          const options =
            field === "currency"
              ? currencies.map((value) => ({ value, label: value }))
              : field === "timezone"
                ? timezones.map((value) => ({ value, label: value }))
                : field === "agentTone"
                  ? agentTones.map((value) => ({ value, label: t(`tones.${value}`) }))
                  : null;
          if (options)
            return (
              <div key={field} className="space-y-2">
                <label htmlFor={id} className="block text-xs font-medium">
                  {t(`fields.${field}`)}
                </label>
                <FormSelectField
                  control={form.control}
                  name={field}
                  id={id}
                  options={options}
                  disabled={form.formState.isSubmitting}
                  aria-describedby={error ? `${id}-error` : undefined}
                />
                {error ? (
                  <p id={`${id}-error`} className="text-xs text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          if (field === "businessDescription" || field === "agentInstructions")
            return (
              <div key={field} className="space-y-2 sm:col-span-2">
                <label htmlFor={id} className="block text-xs font-medium">
                  {t(`fields.${field}`)}
                </label>
                <textarea
                  {...form.register(field)}
                  id={id}
                  rows={field === "agentInstructions" ? 5 : 3}
                  maxLength={field === "agentInstructions" ? 2000 : 500}
                  className={fieldClassName}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${id}-error` : undefined}
                />
                {error ? (
                  <p id={`${id}-error`} className="text-xs text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          return (
            <InputField
              key={field}
              id={id}
              label={t(`fields.${field}`)}
              {...form.register(field)}
              type={
                field === "openingTime" || field === "closingTime"
                  ? "time"
                  : field === "whatsappPhone"
                    ? "tel"
                    : "text"
              }
              maxLength={field === "whatsappPhone" ? 16 : 80}
              autoComplete={field === "whatsappPhone" ? "tel" : "off"}
              error={error}
              hint={
                field === "whatsappPhone"
                  ? t("phoneHint")
                  : field === "closingTime"
                    ? t("hoursHint")
                    : undefined
              }
            />
          );
        })}
    </div>
  );
}
