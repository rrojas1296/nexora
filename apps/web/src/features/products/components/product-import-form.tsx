"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useProductAccess } from "../hooks/use-products";
import { useProductImport } from "../hooks/use-product-import";
import { ProductImportPreview } from "./product-import-preview";
import {
  downloadProductTemplate,
  importColumns,
  readProductSpreadsheet,
  type ImportFileError,
  type ImportRow,
} from "../services/product-spreadsheet";

export function ProductImportForm({ categories }: { categories: readonly { name: string }[] }) {
  const t = useTranslations("Products");
  const access = useProductAccess();
  const mutation = useProductImport();
  const mounted = useRef(true);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<ImportFileError | "download" | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const attempted = !mutation.isIdle;
  const invalid = rows.some((row) => row.issues.length || !row.input);
  const created = mutation.results.filter((row) => !row.error).length;
  return (
    <div className="space-y-6">
      <section
        className="space-y-5 rounded-3xl border bg-card p-6"
        aria-busy={reading || mutation.isPending}
      >
        <h2 className="text-base font-medium">{t("import.prepare")}</h2>
        <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
          {(
            [
              "limits",
              "required",
              "optional",
              "numbers",
              "identifiers",
              "categories",
              "createOnly",
            ] as const
          ).map((key) => (
            <li key={key}>{t(`import.${key}`)}</li>
          ))}
        </ul>
        <Button
          variant="outline"
          disabled={downloading || mutation.isPending}
          onClick={async () => {
            setDownloading(true);
            setError(null);
            try {
              await downloadProductTemplate(
                [
                  t("import.required"),
                  t("import.optional"),
                  t("import.numbers"),
                  t("import.identifiers"),
                  t("import.limits"),
                  t("import.createOnly"),
                  t("import.categories"),
                  ...categories.map((category) => category.name),
                ],
                importColumns.map((key) => t(`import.labels.${key}`)),
              );
            } catch {
              if (mounted.current && access.isCurrent()) setError("download");
            } finally {
              if (mounted.current && access.isCurrent()) setDownloading(false);
            }
          }}
        >
          {t(downloading ? "import.downloading" : "import.download")}
        </Button>
        <label className="block space-y-2 text-sm">
          <span className="block font-medium">{t("import.choose")}</span>
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="block w-full rounded-xl border bg-background p-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-foreground"
            disabled={reading || attempted}
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!file) return;
              setReading(true);
              setRows([]);
              setError(null);
              setFileName(file.name);
              try {
                const parsed = await readProductSpreadsheet(file, categories);
                if (mounted.current && access.isCurrent()) setRows(parsed);
              } catch (cause) {
                if (mounted.current && access.isCurrent()) {
                  const message = cause instanceof Error ? cause.message : "file";
                  setError(
                    message === "headers" || message === "rows" || message === "empty"
                      ? message
                      : "file",
                  );
                }
              } finally {
                if (mounted.current && access.isCurrent()) setReading(false);
              }
            }}
          />
        </label>
        {reading ? <output className="block text-sm">{t("import.reading")}</output> : null}
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {t(`import.errors.${error}`)}
          </p>
        ) : null}
      </section>
      {rows.length ? (
        <section className="space-y-5 rounded-3xl border bg-card p-6">
          <h2 className="break-words text-base font-medium">
            {t("import.preview", { count: rows.length, file: fileName })}
          </h2>
          {invalid ? (
            <p role="alert" className="text-sm text-destructive">
              {t("import.fixErrors")}
            </p>
          ) : null}
          <ProductImportPreview
            rows={rows}
            results={mutation.results}
            pending={mutation.isPending}
            finished={mutation.isSuccess || mutation.isError}
          />
          <p className="text-sm text-muted-foreground">{t("import.safety")}</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <output className="block text-sm">
              {t(attempted ? "import.progress" : "import.ready", { created, count: rows.length })}
            </output>
            <Button
              disabled={invalid || attempted || reading}
              onClick={() => mutation.mutate(rows)}
            >
              {t(mutation.isPending ? "import.importing" : "import.confirm", {
                count: rows.length,
              })}
            </Button>
          </div>
          {mutation.isSuccess || mutation.isError ? (
            <output className="block text-sm">{t("import.finished")}</output>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
