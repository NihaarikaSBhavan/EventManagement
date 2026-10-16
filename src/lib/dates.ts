/**
 * The demo runs on a fixed business date so seeded statuses (live summit, overdue
 * invoices) stay coherent. Swap for `new Date()` when wired to a real backend.
 */
export const TODAY = '2026-10-16';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const toUtc = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
const parts = (iso: string) => iso.slice(0, 10).split('-').map(Number) as [number, number, number];

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = parts(iso);
  return `${d} ${MON[m - 1]} ${y}`;
}

export function formatShortDate(iso: string): string {
  const [, m, d] = parts(iso);
  return `${d} ${MON[m - 1]}`;
}

export function formatRange(start: string, end: string): string {
  if (start === end) return formatDate(start);
  const [ys, ms, ds] = parts(start);
  const [ye, me, de] = parts(end);
  if (ys === ye && ms === me) return `${ds}–${de} ${MON[ms - 1]} ${ys}`;
  if (ys === ye) return `${ds} ${MON[ms - 1]} – ${de} ${MON[me - 1]} ${ys}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Timestamp for settlements and approvals, anchored to the demo business date. */
export function nowStamp(): string {
  const t = new Date();
  return `${TODAY}T${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}:00+05:30`;
}

export function formatStamp(stamp?: string | null): string {
  if (!stamp) return '—';
  return `${formatDate(stamp)}, ${stamp.slice(11, 16)} IST`;
}

/** Month grid starting Monday; returns ISO dates covering whole weeks. */
export function monthGrid(month: string): string[] {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = Math.ceil((offset + daysIn) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => new Date(Date.UTC(y, m - 1, 1 - offset + i)).toISOString().slice(0, 10));
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
