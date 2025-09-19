const formatterCache = new Map<string, Intl.NumberFormat>();
const FALLBACK_CURRENCY = 'USD';

function createFormatter(currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeCurrency(currency?: string) {
  return (currency ?? FALLBACK_CURRENCY).toUpperCase();
}

export function getCurrencyFormatter(currency?: string): Intl.NumberFormat {
  const normalized = normalizeCurrency(currency);
  const cached = formatterCache.get(normalized);
  if (cached) {
    return cached;
  }

  try {
    const formatter = createFormatter(normalized);
    formatterCache.set(normalized, formatter);
    return formatter;
  } catch {
    if (normalized !== FALLBACK_CURRENCY) {
      return getCurrencyFormatter(FALLBACK_CURRENCY);
    }

    const fallbackCached = formatterCache.get(FALLBACK_CURRENCY);
    if (fallbackCached) {
      return fallbackCached;
    }

    const fallbackFormatter = createFormatter(FALLBACK_CURRENCY);
    formatterCache.set(FALLBACK_CURRENCY, fallbackFormatter);
    return fallbackFormatter;
  }
}

export interface FormatCurrencyOptions {
  signed?: boolean;
}

export function formatCurrency(
  amount: number,
  currency?: string,
  options?: FormatCurrencyOptions,
): string {
  const formatter = getCurrencyFormatter(currency);
  const normalizedAmount = Object.is(amount, -0) ? 0 : amount;
  const formatted = formatter.format(normalizedAmount);

  if (options?.signed && normalizedAmount > 0) {
    return `+${formatted}`;
  }

  return formatted;
}
