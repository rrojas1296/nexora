"use client";

import { useId, type ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export const fieldClassName =
  "w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive";

type InputFieldProps = ComponentProps<"input"> & { label: string; error?: string; hint?: string };

export function InputField({ label, error, hint, id, className, ...props }: InputFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="block text-xs font-medium">
        {label}
      </label>
      <input
        {...props}
        id={fieldId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        className={cn(fieldClassName, className)}
      />
      {hint ? (
        <p id={`${fieldId}-hint`} className="text-xs leading-5 text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
