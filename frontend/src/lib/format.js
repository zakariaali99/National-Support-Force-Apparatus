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

export function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

export function formatDateTime(value) {
  if (!value) return "";
  return `${formatDate(value)} ${formatTime(value)}`;
}

export function formatTime(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12 || 12;
  const hoursStr = String(hours).padStart(2, "0");
  return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
}
