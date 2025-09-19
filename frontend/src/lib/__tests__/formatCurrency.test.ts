import { formatCurrency, getCurrencyFormatter } from '../formatCurrency';

describe('formatCurrency utilities', () => {
  it('reuses formatter instances per currency code', () => {
    const first = getCurrencyFormatter('usd');
    const second = getCurrencyFormatter('USD');
    expect(first).toBe(second);
  });

  it('formats positive values with an explicit sign when requested', () => {
    const formatter = getCurrencyFormatter('USD');
    expect(formatCurrency(123.45, 'usd', { signed: true })).toBe(
      `+${formatter.format(123.45)}`,
    );
  });

  it('formats negative values without adding an extra sign', () => {
    const formatter = getCurrencyFormatter('USD');
    expect(formatCurrency(-50, 'usd', { signed: true })).toBe(
      formatter.format(-50),
    );
  });

  it('formats zero without a sign even when signed is true', () => {
    const formatter = getCurrencyFormatter('USD');
    expect(formatCurrency(0, 'usd', { signed: true })).toBe(
      formatter.format(0),
    );
  });

  it('falls back to USD when an invalid currency is provided', () => {
    const fallback = getCurrencyFormatter('USD');
    const invalid = getCurrencyFormatter('???');

    expect(invalid).toBe(fallback);
    expect(formatCurrency(10, '???')).toBe(fallback.format(10));
  });
});
