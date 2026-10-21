"use client";

import { useId } from "react";
import { Check, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useWatch, type Control, type FieldPathByValue, type FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils/cn";
import { passwordRequirements, passwordStrength } from "../schemas/password-policy";

const levels = ["empty", "weak", "fair", "strong"] as const;
const colors = ["bg-muted", "bg-destructive", "bg-amber-500", "bg-primary"] as const;

export function PasswordStrength<T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: FieldPathByValue<T, string>;
}) {
  const t = useTranslations("PasswordStrength");
  const id = useId();
  const value = String(useWatch({ control, name }) ?? "");
  const strength = passwordStrength(value);
  const requirements = passwordRequirements(value);

  return (
    <div className="space-y-2 text-xs">
      <output id={id} aria-live="polite" aria-atomic="true" className="block text-muted-foreground">
        {t("label")}: <span className="font-medium text-foreground">{t(levels[strength])}</span>
        <span className="sr-only">
          {t("requirementsMet", {
            count: [requirements.length, requirements.letter, requirements.number].filter(Boolean)
              .length,
          })}
        </span>
      </output>
      <meter
        min={0}
        max={3}
        value={strength}
        aria-labelledby={id}
        aria-describedby={`${id}-guidance`}
        aria-valuetext={t(levels[strength])}
        className="sr-only"
      />
      <div aria-hidden="true" className="grid grid-cols-3 gap-1">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            aria-hidden="true"
            className={cn("h-1 rounded-full", step <= strength ? colors[strength] : "bg-muted")}
          />
        ))}
      </div>
      <ul className="grid gap-1 text-muted-foreground">
        {(["length", "letter", "number"] as const).map((key) => (
          <li
            key={key}
            className={cn("flex items-center gap-1.5", requirements[key] && "text-primary")}
          >
            {requirements[key] ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <Minus className="size-3.5" aria-hidden="true" />
            )}
            {t(key)}
            <span className="sr-only">: {t(requirements[key] ? "met" : "unmet")}</span>
          </li>
        ))}
      </ul>
      {!requirements.byteLimit ? <p className="text-destructive">{t("tooLong")}</p> : null}
      <p id={`${id}-guidance`} className="text-muted-foreground">
        {t("guidance")}
      </p>
    </div>
  );
}
