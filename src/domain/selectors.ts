import { daysBetween } from '@/lib/dates';
import { DEPARTMENT_BUDGETS, DEPARTMENTS, RTGS_THRESHOLD } from './constants';
import type {
  CustomerInvoice, Dataset, Employee, Expense, GearRequest, GearLine, InventoryItem, JobOrder, LineItem, TransferMode, VendorBill,
} from './types';

// ---------- invoices

export function invoiceTotals(lines: LineItem[], gstRate: number) {
  const subtotal = lines.reduce((sum, l) => sum + (l.qty || 0) * (l.rate || 0), 0);
  const gst = (subtotal * gstRate) / 100;
  return { subtotal, gst, total: subtotal + gst };
}

export const documentTotal = (doc: CustomerInvoice | VendorBill) => invoiceTotals(doc.lines, doc.gst).total;

export function receivables(invoices: CustomerInvoice[], today: string) {
  let collected = 0, pending = 0, overdue = 0, overdueOver30 = 0, overdueCount = 0;
  const collectedByEvent: Record<string, number> = {};
  for (const inv of invoices) {
    const total = documentTotal(inv);
    if (inv.status === 'Paid') {
      collected += total;
      collectedByEvent[inv.eventCode] = (collectedByEvent[inv.eventCode] ?? 0) + total;
    } else if (inv.status === 'Overdue') {
      overdue += total;
      overdueCount += 1;
      if (daysBetween(inv.dueOn, today) > 30) overdueOver30 += total;
    } else {
      pending += total;
    }
  }
  return { collected, pending, overdue, overdueOver30, overdueCount, invoiced: collected + pending + overdue, collectedByEvent };
}

/** Settled receivables grouped by calendar month (YYYY-MM), oldest first. */
export function collectionsByMonth(invoices: CustomerInvoice[]) {
  const map = new Map<string, number>();
  for (const inv of invoices) {
    if (inv.status !== 'Paid' || !inv.settledAt) continue;
    const key = inv.settledAt.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + documentTotal(inv));
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, amount]) => ({ month, amount }));
}

// ---------- inventory

/** Units reserved per item by every job order that is not yet completed. */
export function allocationByItem(jobs: JobOrder[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const job of jobs) {
    if (job.stage === 'Completed') continue;
    for (const g of job.gear) out[g.itemId] = (out[g.itemId] ?? 0) + g.qty;
  }
  return out;
}

export function available(item: InventoryItem, allocation: Record<string, number>): number {
  return Math.max(0, item.total - (allocation[item.id] ?? 0));
}

export function jobsUsingItem(jobs: JobOrder[], itemId: string) {
  return jobs
    .filter((j) => j.stage !== 'Completed')
    .flatMap((j) => j.gear.filter((g) => g.itemId === itemId).map((g) => ({ job: j, qty: g.qty })));
}

/**
 * Reserves what stock allows. Returns granted lines plus any shortfall so the
 * caller can tell the user exactly what could not be reserved.
 */
export function reserveGear(request: GearRequest, inventory: InventoryItem[], jobs: JobOrder[]) {
  const allocation = allocationByItem(jobs);
  const granted: GearLine[] = [];
  const shortfall: { item: InventoryItem; requested: number; granted: number }[] = [];
  for (const [itemId, raw] of Object.entries(request)) {
    const requested = Math.floor(raw);
    if (!(requested > 0)) continue;
    const item = inventory.find((i) => i.id === itemId);
    if (!item) continue;
    const qty = Math.min(requested, available(item, allocation));
    if (qty > 0) granted.push({ itemId, qty });
    if (qty < requested) shortfall.push({ item, requested, granted: qty });
  }
  return { granted, shortfall };
}

// ---------- job orders

export function jobProgress(job: JobOrder) {
  const done = job.deliverables.filter((d) => d.done).length;
  const total = job.deliverables.length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

export const isLate = (job: JobOrder, today: string) => job.stage !== 'Completed' && job.due < today;

// ---------- payroll

export function payBreakdown(e: Pick<Employee, 'basic' | 'hra' | 'siteAllowance' | 'tds' | 'pf'>) {
  const gross = e.basic + e.hra + e.siteAllowance;
  const deductions = e.tds + e.pf;
  return { gross, deductions, net: gross - deductions };
}

export const transferModeFor = (net: number): TransferMode => (net >= RTGS_THRESHOLD ? 'RTGS' : 'NEFT');

// ---------- expenses & budgets

export function departmentBudgets(expenses: Expense[]) {
  return DEPARTMENTS.map((department) => {
    const budget = DEPARTMENT_BUDGETS[department];
    const own = expenses.filter((e) => e.department === department);
    const spent = own.filter((e) => e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
    const committed = own.filter((e) => e.status === 'Pending Approval').reduce((s, e) => s + e.amount, 0);
    return { department, budget, spent, committed, headroom: budget - spent - committed };
  });
}

// ---------- company P&L

export function operatingSummary(data: Dataset, today: string) {
  const ar = receivables(data.invoices, today);
  const billsPaid = data.bills.filter((b) => b.status === 'Paid').reduce((s, b) => s + documentTotal(b), 0);
  const billsOpen = data.bills.filter((b) => b.status !== 'Paid').reduce((s, b) => s + documentTotal(b), 0);
  const expensesApproved = data.expenses.filter((e) => e.status === 'Approved').reduce((s, e) => s + e.amount, 0);
  const expensesPending = data.expenses.filter((e) => e.status === 'Pending Approval').reduce((s, e) => s + e.amount, 0);
  const payrollDisbursed = data.employees.filter((e) => e.payStatus === 'Disbursed').reduce((s, e) => s + payBreakdown(e).net, 0);
  const surplus = ar.collected - billsPaid - expensesApproved - payrollDisbursed;
  return { revenue: ar.collected, billsPaid, billsOpen, expensesApproved, expensesPending, payrollDisbursed, surplus };
}

// ---------- ids

/** Next id after the highest trailing number in the list: L-108 → L-109. */
export function nextId<T>(list: T[], key: (item: T) => string, prefix: string, width: number): string {
  const max = list.reduce((m, item) => {
    const match = key(item).match(/(\d+)$/);
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
}

/** JO-2026-CHE01-A, -B, … per parent event. */
export function nextJobNumber(jobs: JobOrder[], eventCode: string): string {
  const count = jobs.filter((j) => j.eventCode === eventCode).length;
  return `JO-${eventCode.replace(/^EV-/, '')}-${String.fromCharCode(65 + count)}`;
}
