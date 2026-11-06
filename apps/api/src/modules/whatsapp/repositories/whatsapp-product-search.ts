const searchConnectors = new Set([
  "de",
  "del",
  "el",
  "la",
  "los",
  "las",
  "con",
  "the",
  "with",
  "of",
]);

export function productSearchTerms(query: string): string[] {
  const normalized = query
    .normalize("NFKC")
    .toLowerCase()
    .replace(/(\d)\s*(mb|gb|tb)\b/g, "$1 $2");
  const terms = normalized.match(/[\p{L}\p{N}]+/gu) ?? [];
  return [...new Set(terms.filter((term) => !searchConnectors.has(term)))];
}
