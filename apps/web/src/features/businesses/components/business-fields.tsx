"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { InputField, fieldClassName } from "@/components/ui/input-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { currencies } from "@/lib/config/currency";
import type { BusinessInput } from "../schemas/business-schema";

export function BusinessFields({
  form,
  creating,
  disabled,
}: {
  form: UseFormReturn<BusinessInput>;
  creating: boolean;
  disabled: boolean;
}) {
  const t = useTranslations("Businesses");
  const agent = useTranslations("Agent");
  const errors = form.formState.errors;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <InputField
        label={t("name")}
        maxLength={120}
        {...form.register("name")}
        error={errors.name ? t("invalid") : undefined}
      />
      <InputField
        label={t("timezone")}
        maxLength={100}
        {...form.register("timezone")}
        hint={t("timezoneHint")}
        error={errors.timezone ? t("invalid") : undefined}
      />
      <div className="space-y-2">
        <label htmlFor="business-currency" className="text-xs font-medium">
          {t("currency")}
        </label>
        <FormSelectField
          control={form.control}
          name="currency"
          id="business-currency"
          disabled={disabled}
          options={currencies.map((value) => ({ value, label: value }))}
        />
        <p className="text-xs leading-5 text-muted-foreground">{t("currencyHint")}</p>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <label htmlFor="business-description" className="text-xs font-medium">
          {t("description")}
        </label>
        <textarea
          id="business-description"
          {...form.register("description")}
          maxLength={1000}
          rows={3}
          aria-invalid={!!errors.description}
          className={fieldClassName}
        />
      </div>
      {creating ? (
        <>
          <InputField
            label={agent("name")}
            maxLength={100}
            {...form.register("agentName")}
            error={errors.agentName ? t("invalid") : undefined}
          />
          <div className="space-y-2">
            <label htmlFor="business-agent-tone" className="text-xs font-medium">
              {agent("tone")}
            </label>
            <FormSelectField
              control={form.control}
              name="agentTone"
              id="business-agent-tone"
              disabled={disabled}
              options={(["friendly", "professional", "concise"] as const).map((value) => ({
                value,
                label: agent(`tones.${value}`),
              }))}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
