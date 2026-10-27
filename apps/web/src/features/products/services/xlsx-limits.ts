// XLSX is ZIP. Bound its declared expansion before streaming its actual contents.
// Reject ZIP64, encrypted archives and oversized central directories.
export function validateXlsxArchive(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const invalid = () => {
    throw new Error("file");
  };
  let end = buffer.byteLength - 22;
  const minimum = Math.max(0, end - 65535);
  while (end >= minimum && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < minimum || end + 22 + view.getUint16(end + 20, true) !== buffer.byteLength)
    return invalid();
  const entries = view.getUint16(end + 10, true);
  const size = view.getUint32(end + 12, true);
  let offset = view.getUint32(end + 16, true);
  if (
    view.getUint32(end + 4, true) !== 0 ||
    entries === 0 ||
    entries > 100 ||
    offset + size !== end
  )
    return invalid();
  let expanded = 0;
  for (let index = 0; index < entries; index++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) return invalid();
    expanded += view.getUint32(offset + 24, true);
    if ((view.getUint16(offset + 8, true) & 1) !== 0 || expanded > 20 * 1024 * 1024)
      return invalid();
    offset +=
      46 +
      view.getUint16(offset + 28, true) +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true);
  }
  if (offset !== end) invalid();
}

function parseWorkbookXml(xml: string): Document {
  if (/<!DOCTYPE/i.test(xml)) throw new Error("file");
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror")) throw new Error("file");
  return document;
}

function spreadsheetText(element: Element): string {
  return Array.from(element.children)
    .map((child) => {
      if (child.localName === "t") return child.textContent ?? "";
      if (child.localName === "r")
        return Array.from(child.children)
          .filter((part) => part.localName === "t")
          .map((part) => part.textContent ?? "")
          .join("");
      return "";
    })
    .join("");
}

function normalizeWorkbookXml(xml: string, sharedStrings: readonly string[]): string {
  const document = parseWorkbookXml(xml);
  const elements = Array.from(document.getElementsByTagName("*"));
  // Spreadsheet editors retain formatted, empty cells far beyond the data.
  // Remove those before enforcing content bounds or handing XML to ExcelJS.
  for (const cell of elements.filter((element) => element.localName === "c")) {
    const hasValue = Array.from(cell.children).some(
      (child) =>
        child.localName === "f" ||
        (child.localName === "is" && spreadsheetText(child) !== "") ||
        (child.localName === "v" &&
          (cell.getAttribute("t") === "s"
            ? sharedStrings[Number(child.textContent)] !== ""
            : (child.textContent ?? "") !== "")),
    );
    if (!hasValue) cell.remove();
  }
  for (const element of elements) {
    const tag = element.localName;
    if (
      ["mergeCell", "mergeCells", "dataValidation", "dataValidations", "definedName"].includes(tag)
    )
      throw new Error("file");
    if (tag === "definedNames" && element.children.length === 0) {
      element.remove();
      continue;
    }
    if (tag === "row" && !Array.from(element.children).some((child) => child.localName === "c")) {
      element.remove();
      continue;
    }
    if (!document.documentElement.contains(element)) continue;
    if (tag === "row" && !/^(?:[1-9]\d{0,2}|1\d{3}|2000)$/.test(element.getAttribute("r") ?? ""))
      throw new Error("file");
    if (tag === "c" && !/^[A-O](?:[1-9]\d{0,2}|1\d{3}|2000)$/.test(element.getAttribute("r") ?? ""))
      throw new Error("file");
    if (tag === "col") {
      const min = Number(element.getAttribute("min"));
      const max = Number(element.getAttribute("max"));
      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 16384 || min > max)
        throw new Error("file");
      // Column definitions are formatting, not product values. Clip their
      // ranges so ExcelJS never expands thousands of unused styled columns.
      if (min > 15) element.remove();
      else element.setAttribute("max", String(Math.min(max, 15)));
    }
  }
  return new XMLSerializer().serializeToString(document);
}

export async function boundedXlsxBuffer(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  validateXlsxArchive(buffer);
  const { Unzip, UnzipInflate, zipSync } = await import("fflate");
  const files: Record<string, Uint8Array> = Object.create(null);
  const names = new Set<string>();
  let expanded = 0;
  let completed = 0;
  const unzip = new Unzip((file) => {
    if (
      names.has(file.name) ||
      names.size >= 100 ||
      file.name.includes("..") ||
      file.name.startsWith("/")
    )
      throw new Error("file");
    // ExcelJS dispatches worksheet names with an unanchored regex; enforce
    // canonical names before deciding which entries contain XML.
    if (
      /xl\/worksheets\/sheet\d+[.]xml/.test(file.name) &&
      !/^xl\/worksheets\/sheet\d+[.]xml$/.test(file.name)
    )
      throw new Error("file");
    names.add(file.name);
    const chunks: Uint8Array[] = [];
    let length = 0;
    file.ondata = (error, chunk, final) => {
      if (error) throw new Error("file");
      expanded += chunk.byteLength;
      length += chunk.byteLength;
      if (expanded > 20 * 1024 * 1024) throw new Error("file");
      chunks.push(chunk);
      if (!final) return;
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const part of chunks) {
        bytes.set(part, offset);
        offset += part.length;
      }
      files[file.name] = bytes;
      completed++;
    };
    file.start();
  });
  unzip.register(UnzipInflate);
  const bytes = new Uint8Array(buffer);
  // Small compressed chunks bound each deflate output allocation as well.
  for (let offset = 0; offset < bytes.length; offset += 1024) {
    unzip.push(bytes.subarray(offset, offset + 1024), offset + 1024 >= bytes.length);
  }
  if (!names.size || completed !== names.size) throw new Error("file");
  const stringsXml = files["xl/sharedStrings.xml"];
  const sharedStrings = stringsXml
    ? Array.from(parseWorkbookXml(new TextDecoder().decode(stringsXml)).documentElement.children)
        .filter((element) => element.localName === "si")
        .map(spreadsheetText)
    : [];
  // Shared strings may occur after worksheets in the ZIP. Resolve them before
  // deciding whether a formatted cell is empty, independently of entry order.
  for (const name of names) {
    if (/\.xml$/i.test(name))
      files[name] = new TextEncoder().encode(
        normalizeWorkbookXml(new TextDecoder().decode(files[name]), sharedStrings),
      );
  }
  // Rebuild from exactly the validated contents: no ZIP parser differentials or
  // second unbounded decompression of attacker-controlled streams in ExcelJS.
  return new Uint8Array(zipSync(files, { level: 0 })).buffer;
}
