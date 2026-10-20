"use client";

import type { FieldValues, UseFormReturn } from "react-hook-form";
import { InputField, fieldClassName } from "@/components/ui/input-field";
import { useValidationMessage } from "../hooks/use-validation-message";
import type { RecordField } from "./record-form";

export function RecordInput<T extends FieldValues>({
  form,
  field,
}: {
  form: UseFormReturn<T>;
  field: RecordField<T>;
}) {
  const validationMessage = useValidationMessage();
  const id = `record-${field.name}`;
  const message = validationMessage(form.getFieldState(field.name, form.formState).error);
  const registration = form.register(field.name, { valueAsNumber: field.kind === "number" });
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
          <select
            id={id}
            {...registration}
            className={fieldClassName}
            aria-invalid={Boolean(message)}
            aria-describedby={message ? `${id}-error` : undefined}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
