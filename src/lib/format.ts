const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

/** Single source of truth for currency display: ₹48,00,000 (Indian grouping, no paise). */
export function formatINR(value: number): string {
  return inr.format(Math.round(Number.isFinite(value) ? value : 0));
}

/** ₹48L / ₹1.2Cr for chart axes where full figures would crowd. */
export function formatINRCompact(value: number): string {
  if (Math.abs(value) >= 1e7) return `₹${trim(value / 1e7)}Cr`;
  if (Math.abs(value) >= 1e5) return `₹${trim(value / 1e5)}L`;
  return `₹${compact.format(value)}`;
}

function trim(n: number) {
  return n.toFixed(n >= 10 ? 0 : 1).replace(/\.0$/, '');
}

export function formatNumber(value: number): string {
  return num.format(Math.round(value));
}

export function formatPercent(part: number, whole: number): string {
  return `${percent(part, whole)}%`;
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

/** Parses user-typed money ("27,00,000", "₹ 2700000") into a number; NaN when empty or invalid. */
export function parseAmount(input: string | number | undefined | null): number {
  if (typeof input === 'number') return input;
  const cleaned = String(input ?? '').replace(/[^0-9.]/g, '');
  return cleaned === '' ? NaN : Number(cleaned);
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundred(n: number): string {
  return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '');
}
function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : '', rest ? belowHundred(rest) : ''].filter(Boolean).join(' ');
}

/** Indian-system amount in words: 1,23,45,678 → "One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight". */
export function amountInWords(value: number): string {
  let n = Math.round(value);
  if (n <= 0) return 'Zero';
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  return [
    crore ? `${belowThousand(crore)} Crore` : '',
    lakh ? `${belowHundred(lakh)} Lakh` : '',
    thousand ? `${belowHundred(thousand)} Thousand` : '',
    n ? belowThousand(n) : '',
  ].filter(Boolean).join(' ');
}
