// Money helpers. Client-safe. Amounts are integer minor units; the number of
// minor digits comes from ISO 4217 via Intl (PHP 2, JPY 0, ...).

/** Upper bound for one amount in minor units; keeps share math exact in float64. */
export const MAX_AMOUNT_MINOR = 100_000_000_000;
const LOCALE = "en-PH";
const digitsCache = new Map<string, number>();
const formatCache = new Map<string, Intl.NumberFormat>();

export function minorDigits(currency: string): number {
  let digits = digitsCache.get(currency);
  if (digits === undefined) {
    digits =
      new Intl.NumberFormat(LOCALE, {
        style: "currency",
        currency,
      }).resolvedOptions().maximumFractionDigits ?? 2;
    digitsCache.set(currency, digits);
  }
  return digits;
}

export function formatMoney(minor: number, currency: string): string {
  let fmt = formatCache.get(currency);
  if (!fmt) {
    const digits = minorDigits(currency);
    fmt = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    formatCache.set(currency, fmt);
  }
  return fmt.format(minor / 10 ** minorDigits(currency));
}

/** Plain decimal string for prefilling inputs, e.g. 123450 PHP -> "1234.50". */
export function toDecimalString(minor: number, currency: string): string {
  const digits = minorDigits(currency);
  return (minor / 10 ** digits).toFixed(digits);
}

/**
 * Parses user input like "1,234.5" into minor units. Returns null for anything
 * that is not a non-negative decimal with at most the currency's minor digits.
 */
export function parseMoney(input: string, currency: string): number | null {
  const s = input.replace(/[,\s]/g, "");
  const digits = minorDigits(currency);
  const pattern =
    digits === 0
      ? /^\d+$/
      : new RegExp(`^(\\d+(\\.\\d{0,${digits}})?|\\.\\d{1,${digits}})$`);
  if (!pattern.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const minor =
    Number(whole || "0") * 10 ** digits +
    Number(frac.padEnd(digits, "0") || "0");
  return Number.isSafeInteger(minor) ? minor : null;
}
