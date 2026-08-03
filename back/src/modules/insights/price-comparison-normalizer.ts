export function normalizePriceComparisonName(input: string): string {
  const COMBINING_DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
