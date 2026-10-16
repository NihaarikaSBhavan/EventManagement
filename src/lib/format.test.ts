import { amountInWords, formatINR, formatINRCompact, parseAmount, percent } from './format';

describe('formatINR', () => {
  it('uses Indian digit grouping with no paise', () => {
    expect(formatINR(4800000)).toBe('₹48,00,000');
    expect(formatINR(233000)).toBe('₹2,33,000');
    expect(formatINR(12345678.6)).toBe('₹1,23,45,679');
  });
  it('treats non-finite input as zero', () => {
    expect(formatINR(Number.NaN)).toBe('₹0');
  });
});

describe('formatINRCompact', () => {
  it('abbreviates lakh and crore', () => {
    expect(formatINRCompact(4800000)).toBe('₹48L');
    expect(formatINRCompact(12500000)).toBe('₹1.3Cr');
    expect(formatINRCompact(250000)).toBe('₹2.5L');
  });
});

describe('parseAmount', () => {
  it('accepts grouped and symbol-prefixed input', () => {
    expect(parseAmount('27,00,000')).toBe(2700000);
    expect(parseAmount('₹ 2700000')).toBe(2700000);
  });
  it('returns NaN for empty input', () => {
    expect(parseAmount('')).toBeNaN();
  });
});

describe('amountInWords', () => {
  it('spells the Indian system', () => {
    expect(amountInWords(12345678)).toBe('One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight');
    expect(amountInWords(91460)).toBe('Ninety One Thousand Four Hundred Sixty');
    expect(amountInWords(0)).toBe('Zero');
  });
});

describe('percent', () => {
  it('rounds to one decimal and guards zero', () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(5, 0)).toBe(0);
  });
});
