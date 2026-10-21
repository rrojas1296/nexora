"use client";

import { useTranslations } from "next-intl";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { FormSelectField } from "@/components/ui/form-select-field";
import { InputField } from "@/components/ui/input-field";
import { getCallingCode, phoneCountries } from "../config/phone-countries";
import type { OnboardingValues } from "../schemas/onboarding-schema";

export function OnboardingPhoneField({ form }: { form: UseFormReturn<OnboardingValues> }) {
  const t = useTranslations("Onboarding");
  const country = useWatch({ control: form.control, name: "whatsappCountry" });
  const callingCode = getCallingCode(country);
  const countryError = form.formState.errors.whatsappCountry?.message;
  const disabled = form.formState.isSubmitting;

  return (
    <div className="grid gap-5 sm:col-span-2 sm:grid-cols-2">
      <div className="space-y-2">
        <label htmlFor="onboarding-whatsappCountry" className="block text-xs font-medium">
          {t("fields.whatsappCountry")}
        </label>
        <FormSelectField
          control={form.control}
          name="whatsappCountry"
          id="onboarding-whatsappCountry"
          options={phoneCountries.map(({ country, callingCode }) => ({
            value: country,
            label: `${t(`countries.${country}`)} (${callingCode})`,
          }))}
          disabled={disabled}
          aria-describedby={countryError ? "onboarding-whatsappCountry-error" : undefined}
          onValueChange={(value) => {
            const phone = form.getValues("whatsappPhone");
            const nextCountry = phoneCountries.find(({ country }) => country === value);
            if (!nextCountry) return;
            form.setValue(
              "whatsappPhone",
              phone ? nextCountry.callingCode + phone.slice(callingCode.length) : "",
              { shouldDirty: true, shouldValidate: true },
            );
          }}
        />
        {countryError ? (
          <p id="onboarding-whatsappCountry-error" className="text-xs text-destructive">
            {countryError}
          </p>
        ) : null}
      </div>
      <Controller
        control={form.control}
        name="whatsappPhone"
        render={({ field, fieldState }) => (
          <InputField
            {...field}
            id="onboarding-whatsappPhone"
            label={t("fields.whatsappPhone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={field.value ? field.value.slice(callingCode.length) : ""}
            onChange={(event) => {
              const number = event.target.value.replace(/[\s()-]/g, "");
              const nationalNumber = number.startsWith(callingCode)
                ? number.slice(callingCode.length)
                : number;
              field.onChange(nationalNumber ? callingCode + nationalNumber : "");
            }}
            disabled={disabled}
            error={fieldState.error?.message}
            hint={t("phoneHint", { code: callingCode })}
          />
        )}
      />
    </div>
  );
}
