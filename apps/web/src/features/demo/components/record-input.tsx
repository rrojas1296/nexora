"use client";

import type { FieldValues, UseFormReturn } from "react-hook-form";
import { InputField, fieldClassName } from "@/components/ui/input-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useValidationMessage } from "../hooks/use-validation-message";
import type { RecordField } from "./record-form";

export function RecordInput<T extends FieldValues>({
  form,
  field,
  disabled,
}: {
  form: UseFormReturn<T>;
  field: RecordField<T>;
  disabled?: boolean;
}) {
  const validationMessage = useValidationMessage();
  const id = `record-${field.name}`;
  const message = validationMessage(form.getFieldState(field.name, form.formState).error);
  const registration =
    field.kind === "select"
      ? undefined
      : form.register(field.name, { valueAsNumber: field.kind === "number" });
  if (field.kind === "checkbox")
    return (
      <label htmlFor={id} className="flex min-h-11 items-center gap-3 text-xs">
        <input id={id} type="checkbox" {...registration} className="size-4 accent-primary" />
        {field.label}
      </label>
    );
  if (field.kind === "select" || field.kind === "textarea")
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="block text-xs font-medium">
          {field.label}
        </label>
        {field.kind === "select" ? (
          <FormSelectField
            control={form.control}
            name={field.name}
            id={id}
            options={field.options ?? []}
            placeholder={field.placeholder}
            disabled={disabled}
            aria-describedby={message ? `${id}-error` : undefined}
          />
        ) : (
          <textarea
            id={id}
            {...registration}
            rows={4}
            maxLength={field.maxLength ?? 2000}
            className={fieldClassName}
            aria-invalid={Boolean(message)}
            aria-describedby={message ? `${id}-error` : undefined}
          />
        )}
        {message ? (
          <p id={`${id}-error`} className="text-xs text-destructive">
            {message}
          </p>
        ) : null}
      </div>
    );
  return (
    <InputField
      id={id}
      label={field.label}
      type={field.kind ?? "text"}
      {...registration}
      min={field.min}
      max={field.max}
      step={field.step}
      maxLength={field.maxLength ?? 100}
      error={message}
      hint={field.hint}
    />
  );
}
