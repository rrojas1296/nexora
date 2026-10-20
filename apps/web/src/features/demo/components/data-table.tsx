import type { ReactNode } from "react";

export function DataTable<T extends { id: string }>({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: readonly { key: string; label: string; render: (row: T) => ReactNode }[];
  rows: readonly T[];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full min-w-160 text-start text-xs">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b bg-secondary/30 text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className="px-5 py-4 text-start font-normal">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-b-0 hover:bg-secondary/20">
              {columns.map((column) => (
                <td key={column.key} className="px-5 py-4 align-top">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
