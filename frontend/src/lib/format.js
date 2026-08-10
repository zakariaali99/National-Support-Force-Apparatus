// Arabic locale, but with Latin (0-9) numerals rather than Arabic-Indic
// (٠١٢٣...) — the "-u-nu-latn" Unicode extension is what forces that.
// Every number/date shown anywhere in the app must go through one of
// these helpers rather than calling Intl directly, or a stray call will
// silently render Arabic-Indic digits and this rule erodes one screen at
// a time.
const LOCALE = "ar-LY-u-nu-latn";

export function formatNumber(value, options) {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "";
  return new Intl.NumberFormat(LOCALE, options).format(num);
}

export function formatDate(value, options = { year: "numeric", month: "2-digit", day: "2-digit" }) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE, options).format(date);
}

export function formatDateTime(value) {
  return formatDate(value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
