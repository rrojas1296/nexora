function csvCell(value: string | number): string {
  const text =
    typeof value === "string" && /^[\s]*[=+@\-\t\r]/.test(value) ? `'${value}` : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
export function exportReport(
  headers: readonly string[],
  rows: readonly (readonly (string | number)[])[],
  filename: string,
): void {
  const content =
    "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
