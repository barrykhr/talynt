// Money display. Amounts are stored in their original currency; there is no
// conversion — totals are always shown per currency.
export function formatMoney(amount: number | string | null | undefined, currency = "INR", opts: { compact?: boolean } = {}): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency", currency, maximumFractionDigits: opts.compact ? 1 : n % 1 === 0 ? 0 : 2,
      ...(opts.compact ? { notation: "compact" as const } : {}),
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString("en-IN")}`;
  }
}
