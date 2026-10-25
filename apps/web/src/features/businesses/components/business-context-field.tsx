"use client";

import { useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { fieldClassName } from "@/components/ui/input-field";
import type { BusinessInput } from "../schemas/business-schema";

export function BusinessContextField({
  form,
  disabled,
}: {
  form: UseFormReturn<BusinessInput>;
  disabled: boolean;
}) {
  const t = useTranslations("Businesses");
  const [preview, setPreview] = useState(false);
  const value = useWatch({ control: form.control, name: "contextDraft" });
  return (
    <section className="space-y-4 border-t pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="business-context" className="text-base font-medium">
          {t("context")}
        </label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || !!value}
            onClick={() => form.setValue("contextDraft", t("template"), { shouldDirty: true })}
          >
            {t("useTemplate")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={preview}
            onClick={() => setPreview(!preview)}
          >
            {t(preview ? "editText" : "preview")}
          </Button>
        </div>
      </div>
      <p id="business-context-hint" className="max-w-3xl text-xs leading-6 text-muted-foreground">
        {t("contextHint")}
      </p>
      <textarea
        id="business-context"
        {...form.register("contextDraft")}
        maxLength={30000}
        rows={18}
        readOnly={disabled}
        aria-describedby="business-context-hint business-context-count"
        aria-invalid={!!form.formState.errors.contextDraft}
        className={fieldClassName}
      />
      {preview ? (
        <div className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl border bg-muted/30 p-5 text-sm leading-7">
          {value || t("emptyContext")}
        </div>
      ) : null}
      <p id="business-context-count" className="text-xs text-muted-foreground">
        {t("characters", { count: value.length })}
      </p>
      <p className="max-w-3xl text-xs leading-6 text-muted-foreground">{t("contextSafety")}</p>
    </section>
  );
}
