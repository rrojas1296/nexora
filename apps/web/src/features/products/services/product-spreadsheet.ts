import type { CellValue } from "exceljs";
import { productInputSchema, type ProductInput } from "../schemas/product-schema";
import { boundedXlsxBuffer } from "./xlsx-limits";

export const importColumns = [
  "name",
  "category",
  "price",
  "stock",
  "sku",
  "brand",
  "barcode",
  "supplier",
  "description",
  "cost",
  "compareAtPrice",
  "lowStockThreshold",
  "weight",
  "active",
  "imageUrl",
] as const;
export type ImportColumn = (typeof importColumns)[number];
export type ImportIssue = {
  field: ImportColumn;
  code: "invalid" | "category" | "duplicate" | "cell";
};
export type ImportRow = {
  number: number;
  name: string;
  input: ProductInput | null;
  issues: ImportIssue[];
};
export type ImportFileError = "file" | "headers" | "rows" | "empty";
export const maxImportRows = 100;

export async function downloadProductTemplate(instructions: string[], labels: string[]) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Products");
  sheet.columns = importColumns.map((key) => ({ header: key, key, width: 24 }));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  for (const key of ["sku", "barcode"] as const) sheet.getColumn(key).numFmt = "@";
  importColumns.forEach((key, index) => {
    sheet.getCell(1, index + 1).note = labels[index] ?? key;
  });
  const help = workbook.addWorksheet("Instructions");
  help.getColumn(1).width = 110;
  instructions.forEach((line) => help.addRow([line]));
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(buffer)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "products-template.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}

function scalar(value: CellValue): value is string | number | boolean | null | undefined {
  return value == null || ["string", "number", "boolean"].includes(typeof value);
}
function numeric(value: CellValue, fallback?: number) {
  if (value == null || value === "") return fallback;
  if (typeof value === "number") return value;
  if (typeof value !== "string" || !/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return Number.NaN;
  return Number(value.trim().replace(",", "."));
}
function boolean(value: CellValue) {
  if (value == null || value === "") return true;
  if (typeof value === "boolean") return value;
  if (value === 1 || value === 0) return value === 1;
  if (typeof value !== "string") return undefined;
  const text = value.trim().toLowerCase();
  if (["true", "1", "si", "sí", "yes"].includes(text)) return true;
  if (["false", "0", "no"].includes(text)) return false;
  return undefined;
}

export async function readProductSpreadsheet(
  file: File,
  categories: readonly { name: string }[],
): Promise<ImportRow[]> {
  if (!/\.xlsx$/i.test(file.name) || file.size === 0 || file.size > 2 * 1024 * 1024)
    throw new Error("file");
  const buffer = await boundedXlsxBuffer(await file.arrayBuffer());
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  try {
    await workbook.xlsx.load(buffer, { ignoreNodes: ["mergeCells", "dataValidations"] });
  } catch {
    throw new Error("file");
  }
  const sheet = workbook.getWorksheet("Products");
  if (
    !sheet ||
    sheet.columnCount !== importColumns.length ||
    importColumns.some((key, index) => sheet.getCell(1, index + 1).value !== key)
  )
    throw new Error("headers");
  // Bound the row indices too: sparse worksheets must not trigger huge loops.
  if (sheet.rowCount > maxImportRows + 1) throw new Error("rows");
  const rows: ImportRow[] = [];
  const references = new Map<string, ImportRow>();
  for (let number = 2; number <= sheet.rowCount; number++) {
    const row = sheet.getRow(number);
    const values = importColumns.map((_, index) => row.getCell(index + 1).value);
    if (values.every((value) => value == null || value === "")) continue;
    const issues: ImportIssue[] = [];
    const fields = Object.fromEntries(importColumns.map((key, index) => [key, values[index]]));
    importColumns.forEach((field, index) => {
      if (
        !scalar(values[index]) ||
        row.getCell(index + 1).isMerged ||
        ((field === "sku" || field === "barcode") &&
          values[index] != null &&
          typeof values[index] !== "string")
      ) {
        issues.push({ field, code: "cell" });
      }
    });
    const text = (key: ImportColumn) =>
      typeof fields[key] === "string" ? fields[key].trim() : fields[key] == null ? "" : fields[key];
    const category = categories.find(
      (item) => item.name.toLowerCase() === String(text("category")).toLowerCase(),
    );
    if (!category) issues.push({ field: "category", code: "category" });
    const result = productInputSchema.safeParse({
      name: text("name"),
      category: category?.name ?? text("category"),
      sku: text("sku"),
      brand: text("brand"),
      barcode: text("barcode"),
      supplier: text("supplier"),
      description: text("description"),
      imageUrl: text("imageUrl"),
      price: numeric(fields.price),
      cost: numeric(fields.cost, 0),
      compareAtPrice: numeric(fields.compareAtPrice, 0),
      stock: numeric(fields.stock, 0),
      lowStockThreshold: numeric(fields.lowStockThreshold, 5),
      weight: numeric(fields.weight, 0),
      active: boolean(fields.active),
    });
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = importColumns.find((column) => column === issue.path[0]);
        if (field && !issues.some((item) => item.field === field))
          issues.push({ field, code: "invalid" });
      }
    }
    const parsed: ImportRow = {
      number,
      name: typeof fields.name === "string" ? fields.name.slice(0, 100) : "—",
      input: result.success ? result.data : null,
      issues,
    };
    if (result.success && result.data.sku) {
      const previous = references.get(result.data.sku);
      if (previous) {
        parsed.issues.push({ field: "sku", code: "duplicate" });
        if (!previous.issues.some((issue) => issue.code === "duplicate"))
          previous.issues.push({ field: "sku", code: "duplicate" });
      } else references.set(result.data.sku, parsed);
    }
    rows.push(parsed);
  }
  if (!rows.length) throw new Error("empty");
  return rows;
}
