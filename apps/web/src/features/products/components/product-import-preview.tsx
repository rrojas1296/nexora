"use client";

import { useTranslations } from "next-intl";
import { DataTable } from "@/features/demo/components/data-table";
import type { ImportResult } from "../hooks/use-product-import";
import { importColumns, type ImportRow } from "../services/product-spreadsheet";

export function ProductImportPreview({
  rows,
  results,
  pending,
  finished,
}: {
  rows: ImportRow[];
  results: ImportResult[];
  pending: boolean;
  finished: boolean;
}) {
  const t = useTranslations("Products");
  const preview = rows.map((row) => ({ ...row, id: String(row.number) }));
  return (
    <DataTable
      caption={t("import.table")}
      rows={preview}
      columns={[
        { key: "number", label: t("import.row"), render: (row) => row.number },
        {
          key: "name",
          label: t("name"),
          render: (row) => (
            <div className="space-y-2">
              <p className="font-medium">{row.name}</p>
              {row.input ? (
                <details>
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    {t("import.details")}
                  </summary>
                  <dl className="mt-3 space-y-2 text-xs">
                    {importColumns.map((key) => (
                      <div key={key} className="flex flex-wrap gap-2">
                        <dt className="font-medium">{t(`import.labels.${key}`)}:</dt>
                        <dd className="max-w-sm break-words whitespace-pre-wrap">
                          {typeof row.input?.[key] === "boolean"
                            ? t(row.input[key] ? "import.yes" : "import.no")
                            : String(row.input?.[key] ?? "") || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ) : null}
            </div>
          ),
        },
        {
          key: "status",
          label: t("import.status"),
          render: (row) => {
            const result = results.find((item) => item.number === row.number);
            if (result)
              return (
                <p className={result.error ? "max-w-sm text-destructive" : "text-primary"}>
                  {result.error ? t(`errors.${result.error}`) : t("import.created")}
                </p>
              );
            if (row.issues.length)
              return (
                <ul className="max-w-sm space-y-1 text-xs text-destructive">
                  {row.issues.map((issue, index) => (
                    <li key={`${issue.field}:${index}`}>
                      {t(`import.labels.${issue.field}`)}: {t(`import.issues.${issue.code}`)}
                    </li>
                  ))}
                </ul>
              );
            return t(finished ? "import.notSent" : pending ? "import.waiting" : "import.valid");
          },
        },
      ]}
    />
  );
}
