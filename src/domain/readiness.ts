import { addDays, daysBetween, formatShortDate } from '@/lib/dates';
import { formatINR, formatNumber, percent } from '@/lib/format';
import { documentTotal, isLate, jobProgress } from './selectors';
import type { Dataset, GearLine, JobOrder, ProductionEvent } from './types';

/**
 * Readiness rules for the event manager. Kept pure and in one place so the
 * definition of "show-ready" can be tuned without touching any screen.
 */

export type Level = 'ready' | 'attention' | 'blocked';
export type CheckKey = 'jobs' | 'gear' | 'money' | 'vendors';
export type WorkspaceTab = 'overview' | 'jobs' | 'gear' | 'money' | 'vendors' | 'show' | 'wrapup';
export type Fix = { kind: 'job'; no: string } | { kind: 'tab'; tab: WorkspaceTab };

export interface Blocker {
  id: string;
  eventCode: string;
  check: CheckKey | 'issue';
  level: Exclude<Level, 'ready'>;
  title: string;
  detail: string;
  owner: string;
  fix: Fix;
}

export interface Check {
  key: CheckKey;
  label: string;
  level: Level;
  summary: string;
  blockers: Blocker[];
}

export type Phase = 'Preparing' | 'Load-in' | 'Live' | 'De-rig' | 'Wrap-up' | 'Closed';

export const CHECK_LABEL: Record<CheckKey, string> = {
  jobs: 'Job orders',
  gear: 'Gear',
  money: 'Client payments',
  vendors: 'Vendors & permits',
};

const SEVERITY: Record<Level, number> = { ready: 0, attention: 1, blocked: 2 };
const worst = (levels: Level[]): Level => levels.reduce<Level>((w, l) => (SEVERITY[l] > SEVERITY[w] ? l : w), 'ready');
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const loadInDate = (e: ProductionEvent) => addDays(e.start, -1);
export const deRigDate = (e: ProductionEvent) => addDays(e.end, 1);

export function eventPhase(e: ProductionEvent, today: string): Phase {
  if (e.closedAt) return 'Closed';
  if (today < loadInDate(e)) return 'Preparing';
  if (today < e.start) return 'Load-in';
  if (today <= e.end) return 'Live';
  if (today <= deRigDate(e)) return 'De-rig';
  return 'Wrap-up';
}

/** Days until load-in (negative once it has passed). */
export const daysToLoadIn = (e: ProductionEvent, today: string) => daysBetween(today, loadInDate(e));

export function countdownLabel(e: ProductionEvent, today: string): string {
  const phase = eventPhase(e, today);
  if (phase === 'Preparing') {
    const d = daysToLoadIn(e, today);
    return d === 1 ? 'Load-in tomorrow' : `Load-in in ${d} days`;
  }
  if (phase === 'Load-in') return 'Load-in today';
  if (phase === 'Live') {
    const left = daysBetween(today, e.end);
    return left === 0 ? 'Live · final day' : `Live · day ${daysBetween(e.start, today) + 1} of ${daysBetween(e.start, e.end) + 1}`;
  }
  if (phase === 'De-rig') return 'De-rig today';
  if (phase === 'Closed') return 'Closed';
  return 'Wrap-up';
}

export function requestedGear(job: JobOrder): GearLine[] {
  return job.requested ?? job.gear;
}

export function gearShortfall(job: JobOrder) {
  return requestedGear(job)
    .map((r) => ({ itemId: r.itemId, requested: r.qty, reserved: job.gear.find((g) => g.itemId === r.itemId)?.qty ?? 0 }))
    .filter((x) => x.reserved < x.requested);
}

function jobsCheck(data: Dataset, e: ProductionEvent, today: string): Check {
  const jobs = data.jobs.filter((j) => j.eventCode === e.code);
  const blockers: Blocker[] = [];
  for (const j of jobs) {
    const p = jobProgress(j);
    if (j.stage === 'Pending Review') {
      const late = isLate(j, today);
      blockers.push({ id: `jobs:${j.no}`, eventCode: e.code, check: 'jobs', level: late ? 'blocked' : 'attention', title: `${j.title} is waiting for QC sign-off`, detail: `${j.no} · all deliverables ticked${late ? ` · ${plural(daysBetween(j.due, today), 'day')} past due` : ''}`, owner: j.teamLead, fix: { kind: 'job', no: j.no } });
    } else if (j.stage === 'Overdue' || isLate(j, today)) {
      const late = Math.max(0, daysBetween(j.due, today));
      blockers.push({ id: `jobs:${j.no}`, eventCode: e.code, check: 'jobs', level: 'blocked', title: `${j.title} is ${late ? `${plural(late, 'day')} late` : 'overdue'}`, detail: `${j.no} · ${p.percent}% done · was due ${formatShortDate(j.due)}`, owner: j.executive, fix: { kind: 'job', no: j.no } });
    } else if (j.stage !== 'Completed' && daysBetween(today, j.due) <= 3 && p.percent < 100) {
      blockers.push({ id: `jobs:${j.no}`, eventCode: e.code, check: 'jobs', level: 'attention', title: `${j.title} is due ${daysBetween(today, j.due) === 0 ? 'today' : `in ${plural(daysBetween(today, j.due), 'day')}`}`, detail: `${j.no} · ${p.done} of ${p.total} deliverables done`, owner: j.executive, fix: { kind: 'job', no: j.no } });
    }
  }
  if (!jobs.length) {
    blockers.push({ id: `jobs:none:${e.code}`, eventCode: e.code, check: 'jobs', level: 'attention', title: 'No job orders yet', detail: 'Create the first job order so the crew knows what to build', owner: e.lead, fix: { kind: 'tab', tab: 'jobs' } });
  }
  const done = jobs.filter((j) => j.stage === 'Completed').length;
  return {
    key: 'jobs', label: CHECK_LABEL.jobs, blockers, level: worst(blockers.map((b) => b.level)),
    summary: !jobs.length ? 'None created yet' : blockers.length ? plural(blockers.length, 'order needs', 'orders need') + ' attention' : `${plural(jobs.length, 'order')} on track${done ? ` · ${done} done` : ''}`,
  };
}

function gearCheck(data: Dataset, e: ProductionEvent): Check {
  const jobs = data.jobs.filter((j) => j.eventCode === e.code && j.stage !== 'Completed');
  const name = (id: string) => data.inventory.find((i) => i.id === id)?.shortName ?? id;
  const blockers: Blocker[] = [];
  for (const j of jobs) {
    for (const s of gearShortfall(j)) {
      blockers.push({ id: `gear:${j.no}:${s.itemId}`, eventCode: e.code, check: 'gear', level: 'blocked', title: `Short ${formatNumber(s.requested - s.reserved)} × ${name(s.itemId)}`, detail: `${j.no} asked for ${formatNumber(s.requested)}, only ${formatNumber(s.reserved)} reserved`, owner: j.teamLead, fix: { kind: 'tab', tab: 'gear' } });
    }
  }
  const units = jobs.reduce((s, j) => s + j.gear.reduce((a, g) => a + g.qty, 0), 0);
  const lines = new Set(jobs.flatMap((j) => j.gear.map((g) => g.itemId))).size;
  if (!units && e.status !== 'Completed') {
    blockers.push({ id: `gear:none:${e.code}`, eventCode: e.code, check: 'gear', level: 'attention', title: 'No gear reserved yet', detail: 'Reserve LED, audio, lighting and power on a job order', owner: e.lead, fix: { kind: 'tab', tab: 'gear' } });
  }
  return {
    key: 'gear', label: CHECK_LABEL.gear, blockers, level: worst(blockers.map((b) => b.level)),
    summary: blockers.some((b) => b.level === 'blocked') ? `${plural(blockers.filter((b) => b.level === 'blocked').length, 'item')} short` : units ? `${formatNumber(units)} units across ${plural(lines, 'line')}` : 'Nothing reserved',
  };
}

function moneyCheck(data: Dataset, e: ProductionEvent, today: string): Check {
  const invoices = data.invoices.filter((i) => i.eventCode === e.code);
  const blockers: Blocker[] = [];
  const toLoadIn = daysToLoadIn(e, today);
  for (const i of invoices) {
    if (i.status === 'Overdue') {
      blockers.push({ id: `money:${i.no}`, eventCode: e.code, check: 'money', level: 'blocked', title: `${i.milestone} of ${formatINR(documentTotal(i))} is overdue`, detail: `${i.no} · ${plural(Math.max(0, daysBetween(i.dueOn, today)), 'day')} past due · ${e.client}`, owner: e.lead, fix: { kind: 'tab', tab: 'money' } });
    } else if (i.status === 'Pending') {
      const advanceSoon = i.milestone !== 'Final Balance' && toLoadIn <= 7;
      blockers.push({ id: `money:${i.no}`, eventCode: e.code, check: 'money', level: advanceSoon ? 'blocked' : 'attention', title: advanceSoon ? `${i.milestone} unpaid with load-in in ${plural(Math.max(0, toLoadIn), 'day')}` : `${i.milestone} of ${formatINR(documentTotal(i))} awaiting payment`, detail: `${i.no} · due ${formatShortDate(i.dueOn)}`, owner: e.lead, fix: { kind: 'tab', tab: 'money' } });
    }
  }
  if (!invoices.some((i) => i.milestone === 'Retainer') && e.status !== 'Completed') {
    blockers.push({ id: `money:retainer:${e.code}`, eventCode: e.code, check: 'money', level: toLoadIn <= 7 ? 'blocked' : 'attention', title: 'Retainer not invoiced', detail: `Raise the retainer on ${e.client} before work starts`, owner: e.lead, fix: { kind: 'tab', tab: 'money' } });
  }
  const collected = invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + documentTotal(i), 0);
  return {
    key: 'money', label: CHECK_LABEL.money, blockers, level: worst(blockers.map((b) => b.level)),
    summary: `${formatINR(collected)} collected · ${percent(collected, e.budget)}% of budget`,
  };
}

function vendorsCheck(data: Dataset, e: ProductionEvent, today: string): Check {
  const bookings = data.bookings.filter((b) => b.eventCode === e.code);
  const blockers: Blocker[] = bookings
    .filter((b) => b.status !== 'Confirmed')
    .map((b) => {
      const pastDue = b.due < today;
      return {
        id: `vendors:${b.id}`, eventCode: e.code, check: 'vendors' as const, level: pastDue ? 'blocked' as const : 'attention' as const,
        title: pastDue ? `${b.name} is ${plural(daysBetween(b.due, today), 'day')} past due` : `${b.name} · ${b.status.toLowerCase()}`,
        detail: `${b.kind} · ${b.detail} · due ${formatShortDate(b.due)}`, owner: b.owner, fix: { kind: 'tab' as const, tab: 'vendors' as const },
      };
    });
  if (!bookings.length && e.status !== 'Completed') {
    blockers.push({ id: `vendors:none:${e.code}`, eventCode: e.code, check: 'vendors', level: 'attention', title: 'No vendors or permits booked', detail: 'Add caterers, logistics and the venue permits this event needs', owner: e.lead, fix: { kind: 'tab', tab: 'vendors' } });
  }
  const confirmed = bookings.filter((b) => b.status === 'Confirmed').length;
  return {
    key: 'vendors', label: CHECK_LABEL.vendors, blockers, level: worst(blockers.map((b) => b.level)),
    summary: bookings.length ? `${confirmed} of ${bookings.length} confirmed` : 'Nothing booked',
  };
}

export interface Readiness {
  event: ProductionEvent;
  phase: Phase;
  countdown: string;
  daysToLoadIn: number;
  checks: Check[];
  level: Level;
  blockers: Blocker[];
}

export function eventReadiness(data: Dataset, e: ProductionEvent, today: string): Readiness {
  const checks = [jobsCheck(data, e, today), gearCheck(data, e), moneyCheck(data, e, today), vendorsCheck(data, e, today)];
  const issues: Blocker[] = data.issues
    .filter((i) => i.eventCode === e.code && !i.resolvedAt)
    .map((i) => ({ id: `issue:${i.id}`, eventCode: e.code, check: 'issue', level: 'blocked', title: i.text, detail: `Reported by ${i.raisedBy}`, owner: e.lead, fix: { kind: 'tab', tab: 'show' } }));
  const blockers = [...issues, ...checks.flatMap((c) => c.blockers)].sort((a, b) => SEVERITY[b.level] - SEVERITY[a.level]);
  return {
    event: e, phase: eventPhase(e, today), countdown: countdownLabel(e, today), daysToLoadIn: daysToLoadIn(e, today),
    checks, blockers, level: worst([...checks.map((c) => c.level), ...issues.map((i) => i.level)]),
  };
}

/** Events the manager is still preparing or running, soonest first. */
export function activeReadiness(data: Dataset, today: string): Readiness[] {
  return data.events
    .filter((e) => e.status !== 'Completed' && !e.closedAt)
    .map((e) => eventReadiness(data, e, today))
    .sort((a, b) => a.event.start.localeCompare(b.event.start));
}

/** Blockers across events, red first, then the event that loads in soonest. */
export function needsAttention(list: Readiness[]): (Blocker & { event: ProductionEvent; daysToLoadIn: number })[] {
  return list
    .flatMap((r) => r.blockers.map((b) => ({ ...b, event: r.event, daysToLoadIn: r.daysToLoadIn })))
    .sort((a, b) => SEVERITY[b.level] - SEVERITY[a.level] || a.daysToLoadIn - b.daysToLoadIn);
}

// ---------- wrap-up

export interface WrapItem { key: string; label: string; done: boolean; detail: string; manual?: boolean }

export function wrapUpChecklist(data: Dataset, e: ProductionEvent): WrapItem[] {
  const jobs = data.jobs.filter((j) => j.eventCode === e.code);
  const openJobs = jobs.filter((j) => j.stage !== 'Completed');
  const gearOut = openJobs.reduce((s, j) => s + j.gear.reduce((a, g) => a + g.qty, 0), 0);
  const invoices = data.invoices.filter((i) => i.eventCode === e.code);
  const finalRaised = invoices.some((i) => i.milestone === 'Final Balance');
  const unpaid = invoices.filter((i) => i.status !== 'Paid');
  const bills = data.bills.filter((b) => b.eventCode === e.code && b.status !== 'Paid');
  return [
    { key: 'jobs', label: 'All job orders completed', done: openJobs.length === 0, detail: openJobs.length ? `${plural(openJobs.length, 'order')} still open` : `${plural(jobs.length, 'order')} signed off` },
    { key: 'gear', label: 'Gear returned to depots', done: gearOut === 0, detail: gearOut ? `${formatNumber(gearOut)} units still out` : 'Everything checked back in' },
    { key: 'final', label: 'Final balance invoiced', done: finalRaised, detail: finalRaised ? 'Raised' : 'Raise the final balance invoice' },
    { key: 'paid', label: 'Client has paid in full', done: finalRaised && unpaid.length === 0, detail: unpaid.length ? `${formatINR(unpaid.reduce((s, i) => s + documentTotal(i), 0))} outstanding` : finalRaised ? 'Settled' : 'Waiting on the final invoice' },
    { key: 'vendors', label: 'Vendors settled', done: bills.length === 0, detail: bills.length ? `${plural(bills.length, 'bill')} · ${formatINR(bills.reduce((s, b) => s + documentTotal(b), 0))} to release` : 'All bills paid' },
    { key: 'feedback', label: 'Client feedback recorded', done: Boolean(e.feedback?.trim()), detail: e.feedback?.trim() ? 'Recorded' : 'Capture what the client said', manual: true },
  ];
}
