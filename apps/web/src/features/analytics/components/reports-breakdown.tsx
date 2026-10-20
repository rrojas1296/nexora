"use client";

import { useFormatter, useTranslations } from "next-intl";
import { DataTable } from "@/features/demo/components/data-table";
import type { ReportRow, ReportView } from "../lib/report-metrics";

export function ReportsBreakdown({
  rows,
  view,
  revenue,
}: {
  rows: readonly ReportRow[];
  view: ReportView;
  revenue: number;
}) {
  const t = useTranslations("Reports");
  const format = useFormatter();
  return rows.length ? (
    <DataTable
      caption={t(view === "products" ? "productTable" : "clientTable")}
      rows={rows}
      columns={[
        {
          key: "name",
          label: t(view === "products" ? "product" : "client"),
          render: (row) => (
            <div>
              <p className="font-medium">{row.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{row.reference}</p>
            </div>
          ),
        },
        { key: "quantity", label: t("units"), render: (row) => format.number(row.quantity) },
        { key: "orders", label: t("orders"), render: (row) => format.number(row.orders) },
        {
          key: "revenue",
          label: t("revenue"),
          render: (row) => format.number(row.revenue, { style: "currency", currency: "USD" }),
        },
        {
          key: "share",
          label: t("share"),
          render: (row) =>
            format.number(revenue ? row.revenue / revenue : 0, {
              style: "percent",
              maximumFractionDigits: 1,
            }),
        },
      ]}
    />
  ) : (
    <p className="rounded-3xl border bg-card p-8 text-center text-sm text-muted-foreground">
      {t("noSales")}
    </p>
  );
}
