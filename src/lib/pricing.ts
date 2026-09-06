// Pricing utilities - canonical source is base_price_minor (minor units, integer)
// Legacy price (numeric) is deprecated but kept for transition.
// Currency handling: supported currencies define minor units (fraction digits).
// All formatting and storage must use explicit currency-aware conversion.

export const SUPPORTED_CURRENCIES = ["USD", "MAD", "EUR", "GBP", "SAR", "AED"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// For all supported currencies, minor units = 100 (2 decimal places)
// If a currency with 0 decimals is added later, adjust this map.
const CURRENCY_MINOR_UNITS: Record<string, number> = {
  USD: 100,
  MAD: 100,
  EUR: 100,
  GBP: 100,
  SAR: 100,
  AED: 100,
};

export function getMinorUnits(currency: string): number {
  return CURRENCY_MINOR_UNITS[currency] ?? 100;
}

/**
 * Canonical conversion: minor integer -> major (e.g., 1999 -> 19.99)
 * Uses strict null/undefined check, not truthiness, so 0 is preserved.
 */
export function minorToMajor(minor: number | null | undefined, currency: string = "MAD"): number | null {
  if (minor === null || minor === undefined) return null;
  const units = getMinorUnits(currency);
  return minor / units;
}

/**
 * Canonical conversion: major -> minor integer
 * Rounds to nearest integer, rejects negative and non-finite.
 */
export function majorToMinor(major: number | null | undefined, currency: string = "MAD"): number | null {
  if (major === null || major === undefined) return null;
  if (!Number.isFinite(major)) return null;
  if (major < 0) return null;
  const units = getMinorUnits(currency);
  return Math.round(major * units);
}

/**
 * Resolve display price from product record.
 * Prefers base_price_minor (canonical), falls back to legacy price only for transition.
 * Returns { minor, major, source } or null if both missing.
 * Zero is valid and returned as 0, not null.
 */
export function resolveProductPrice(product: {
  base_price_minor?: number | null;
  price?: number | null;
  currency?: string | null;
}): { minor: number; major: number; source: "base_price_minor" | "price" } | null {
  const currency = product.currency || "MAD";
  if (product.base_price_minor !== null && product.base_price_minor !== undefined) {
    const major = minorToMajor(product.base_price_minor, currency);
    if (major !== null) return { minor: product.base_price_minor, major, source: "base_price_minor" };
  }
  if (product.price !== null && product.price !== undefined) {
    // price is major units in DB (numeric)
    const minor = majorToMinor(product.price, currency);
    if (minor !== null) return { minor, major: product.price, source: "price" };
  }
  return null;
}

export function resolveCompareAtPrice(product: {
  compare_at_price_minor?: number | null;
  old_price?: number | null;
  currency?: string | null;
}): { minor: number; major: number; source: "compare_at_price_minor" | "old_price" } | null {
  const currency = product.currency || "MAD";
  if (product.compare_at_price_minor !== null && product.compare_at_price_minor !== undefined) {
    const major = minorToMajor(product.compare_at_price_minor, currency);
    if (major !== null) return { minor: product.compare_at_price_minor, major, source: "compare_at_price_minor" };
  }
  if (product.old_price !== null && product.old_price !== undefined) {
    const minor = majorToMinor(product.old_price, currency);
    if (minor !== null) return { minor, major: product.old_price, source: "old_price" };
  }
  return null;
}

export function formatPriceAmount(major: number, currency: string): string {
  // Use explicit formatting, do not assume decimal places without currency.
  // For MAD, keep 2 decimals but trim trailing zeros for display? Keep consistent.
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

export function formatMinorPrice(minor: number, currency: string): string {
  const major = minorToMajor(minor, currency);
  if (major === null) return `—`;
  return formatPriceAmount(major, currency);
}

/**
 * Price filter units: storage is minor. UI may input major (e.g., 50 MAD).
 * Convert consistently.
 */
export function priceFilterMajorToMinor(major: number | undefined, currency: string = "MAD"): number | undefined {
  if (major === undefined || major === null) return undefined;
  const minor = majorToMinor(major, currency);
  return minor ?? undefined;
}
