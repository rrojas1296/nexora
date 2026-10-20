"use client";

import type { ComponentProps } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { SelectField } from "./select-field";

type FormSelectFieldProps<T extends FieldValues> = Omit<
  ComponentProps<typeof SelectField>,
  "name" | "value" | "ref"
> & {
  control: Control<T>;
  name: Path<T>;
};

export function FormSelectField<T extends FieldValues>({
  control,
  name,
  onValueChange,
  disabled,
  ...props
}: FormSelectFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      disabled={disabled}
      render={({ field, fieldState }) => (
        <SelectField
          {...props}
          name={field.name}
          ref={field.ref}
          value={String(field.value ?? "")}
          onBlur={field.onBlur}
          disabled={field.disabled}
          aria-invalid={fieldState.invalid}
          onValueChange={(value) => {
            field.onChange(value);
            onValueChange?.(value);
          }}
        />
      )}
    />
  );
}
