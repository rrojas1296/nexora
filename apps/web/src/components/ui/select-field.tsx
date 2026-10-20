"use client";

import type { ComponentProps, ReactNode } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

type SelectFieldProps = Omit<ComponentProps<typeof SelectTrigger>, "children" | "defaultValue"> & {
  options: readonly { value: string; label: ReactNode; disabled?: boolean }[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
};

export function SelectField({
  options,
  value,
  onValueChange,
  placeholder,
  name,
  required,
  disabled,
  ...triggerProps
}: SelectFieldProps) {
  return (
    <Select
      name={name}
      value={value}
      onValueChange={onValueChange}
      required={required}
      disabled={disabled}
    >
      <SelectTrigger {...triggerProps} disabled={disabled}>
        <SelectValue
          data-slot="select-value"
          className="min-w-0 flex-1"
          placeholder={placeholder}
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
