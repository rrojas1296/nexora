"use client";

import { Fragment } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { MutationNotice } from "./mutation-notice";
import { RecordInput } from "./record-input";

export type RecordField<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  kind?: "text" | "email" | "tel" | "number" | "textarea" | "select" | "checkbox";
  options?: readonly { value: string; label: string }[];
  hint?: string;
  section?: string;
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
};
export function RecordForm<T extends FieldValues>({
  form,
  fields,
  onSave,
  pending,
  error,
  success,
  onCancel,
  readOnly = false,
  columns = false,
}: {
  form: UseFormReturn<T>;
  fields: readonly RecordField<T>[];
  onSave: (values: T) => Promise<void>;
  pending: boolean;
  error: Error | null;
  success?: boolean;
  onCancel?: () => void;
  readOnly?: boolean;
  columns?: boolean;
}) {
  const t = useTranslations("Demo");
  return (
    <form method="post" noValidate onSubmit={form.handleSubmit(onSave)} aria-busy={pending}>
      <fieldset disabled={pending || readOnly} className="space-y-6">
        <legend className="sr-only">{t("form")}</legend>
        <div className={columns ? "grid items-start gap-5 sm:grid-cols-2" : "space-y-5"}>
          {fields.map((field) => (
            <Fragment key={field.name}>
              {field.section ? (
                <h2 className="border-b pb-3 text-base font-medium sm:col-span-2">
                  {field.section}
                </h2>
              ) : null}
              <div className={columns && field.kind === "textarea" ? "sm:col-span-2" : undefined}>
                <RecordInput form={form} field={field} />
              </div>
            </Fragment>
          ))}
        </div>
        <MutationNotice error={error} success={success} />
        <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
          {onCancel ? (
            <Button variant="outline" onClick={onCancel}>
              {t("cancel")}
            </Button>
          ) : null}
          <Button type="submit" disabled={pending || readOnly}>
            {t(pending ? "saving" : "save")}
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
