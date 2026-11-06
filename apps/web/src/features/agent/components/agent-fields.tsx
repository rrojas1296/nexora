"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { InputField, fieldClassName } from "@/components/ui/input-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useValidationMessage } from "@/features/demo/hooks/use-validation-message";
import { responseLanguages, tones, type AgentInput } from "../schemas/agent-schema";

export function AgentFields({
  form,
  disabled,
}: {
  form: UseFormReturn<AgentInput>;
  disabled: boolean;
}) {
  const t = useTranslations("Agent");
  const validationMessage = useValidationMessage();
  return (
    <>
      <Controller
        control={form.control}
        name="name"
        render={({ field, fieldState }) => (
          <InputField
            {...field}
            id="agent-name"
            label={t("name")}
            maxLength={100}
            error={validationMessage(fieldState.error)}
          />
        )}
      />
      <div className="space-y-2">
        <label htmlFor="agent-tone" className="block text-xs font-medium">
          {t("tone")}
        </label>
        <FormSelectField
          control={form.control}
          name="tone"
          id="agent-tone"
          disabled={disabled}
          options={tones.map((value) => ({ value, label: t(`tones.${value}`) }))}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="agent-response-language" className="block text-xs font-medium">
          {t("responseLanguage")}
        </label>
        <FormSelectField
          control={form.control}
          name="responseLanguage"
          id="agent-response-language"
          disabled={disabled}
          aria-describedby="agent-response-language-hint"
          options={responseLanguages.map((value) => ({
            value,
            label: t(`responseLanguages.${value}`),
          }))}
        />
        <p id="agent-response-language-hint" className="text-xs leading-6 text-muted-foreground">
          {t("responseLanguageHint")}
        </p>
      </div>
      {(["greeting"] as const).map((name) => (
        <Controller
          key={name}
          control={form.control}
          name={name}
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <label htmlFor={`agent-${name}`} className="block text-xs font-medium">
                {t(name)}
              </label>
              <textarea
                {...field}
                id={`agent-${name}`}
                rows={4}
                maxLength={300}
                className={fieldClassName}
                aria-invalid={!!fieldState.error}
                aria-describedby={fieldState.error ? `agent-${name}-error` : undefined}
              />
              {fieldState.error ? (
                <p id={`agent-${name}-error`} className="text-xs text-destructive">
                  {validationMessage(fieldState.error)}
                </p>
              ) : null}
            </div>
          )}
        />
      ))}
      <Controller
        control={form.control}
        name="enabled"
        render={({ field }) => (
          <label htmlFor="agent-enabled" className="flex min-h-11 items-center gap-3 text-xs">
            <input
              id="agent-enabled"
              type="checkbox"
              name={field.name}
              ref={field.ref}
              checked={field.value}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(event.target.checked)}
              className="size-4 accent-primary"
            />
            {t("enabled")}
          </label>
        )}
      />
    </>
  );
}
