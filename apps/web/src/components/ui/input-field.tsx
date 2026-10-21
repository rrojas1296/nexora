"use client";

import { useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

export const fieldClassName =
  "w-full rounded-xl border border-input bg-background/70 px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive";

type InputFieldProps = ComponentProps<"input"> & { label: string; error?: string; hint?: string };

export function InputField({ label, error, hint, id, className, type, ...props }: InputFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const t = useTranslations("Common");
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="block text-xs font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          id={fieldId}
          type={isPassword && visible ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(fieldClassName, isPassword && "pr-12", className)}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={t(visible ? "hidePassword" : "showPassword", { label })}
            aria-controls={fieldId}
            aria-pressed={visible}
            disabled={props.disabled}
            onClick={() => setVisible((current) => !current)}
            className="absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
          >
            {visible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>
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
