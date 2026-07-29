export const currency = (v: number, code = "USD", digits = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number.isFinite(v) ? v : 0);

export const compactCurrency = (v: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, notation: "compact", maximumFractionDigits: 1 }).format(Number.isFinite(v) ? v : 0);

export const number = (v: number, digits = 0) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(Number.isFinite(v) ? v : 0);

export const percent = (v: number, digits = 1) => `${(Number.isFinite(v) ? v : 0).toFixed(digits)}%`;

export const shortDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
