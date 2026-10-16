import { TODAY } from '@/lib/dates';
import { createSeed } from './seed';
import {
  allocationByItem, available, departmentBudgets, invoiceTotals, jobProgress, nextId, nextJobNumber, payBreakdown, receivables, reserveGear, transferModeFor,
} from './selectors';

describe('invoiceTotals', () => {
  it('applies GST on the line subtotal', () => {
    expect(invoiceTotals([{ description: 'a', qty: 2, rate: 50000 }, { description: 'b', qty: 1, rate: 100000 }], 18))
      .toEqual({ subtotal: 200000, gst: 36000, total: 236000 });
  });
});

describe('receivables', () => {
  const { invoices } = createSeed();
  const r = receivables(invoices, TODAY);
  it('partitions every invoice into collected, pending or overdue', () => {
    expect(r.collected + r.pending + r.overdue).toBe(r.invoiced);
  });
  it('only counts overdue balances older than 30 days past due in the >30 bucket', () => {
    // INV-0158 is due 1 Oct (15 days) — overdue but not in the >30 bucket.
    expect(r.overdueOver30).toBeLessThan(r.overdue);
    expect(r.overdueCount).toBe(3);
  });
});

describe('inventory allocation', () => {
  const { inventory, jobs } = createSeed();
  it('ignores completed job orders', () => {
    const alloc = allocationByItem(jobs);
    // INV-02: 16 (CHE01-B) + 8 (KOC05-B); the 8 on completed CHE06-A are back at the depot.
    expect(alloc['INV-02']).toBe(24);
  });
  it('reserves only what is available and reports the shortfall', () => {
    const led = inventory.find((i) => i.id === 'INV-01')!;
    expect(available(led, allocationByItem(jobs))).toBe(20);
    const { granted, shortfall } = reserveGear({ 'INV-01': 100, 'INV-06': 5 }, inventory, jobs);
    expect(granted).toEqual([{ itemId: 'INV-01', qty: 20 }, { itemId: 'INV-06', qty: 5 }]);
    expect(shortfall).toHaveLength(1);
    expect(shortfall[0]).toMatchObject({ requested: 100, granted: 20 });
  });
});

describe('payroll', () => {
  it('computes net = (basic + HRA + site) − (TDS + PF)', () => {
    expect(payBreakdown({ basic: 62000, hra: 24800, siteAllowance: 12500, tds: 7900, pf: 7440 })).toEqual({ gross: 99300, deductions: 15340, net: 83960 });
  });
  it('switches to RTGS from ₹2,00,000', () => {
    expect(transferModeFor(199999)).toBe('NEFT');
    expect(transferModeFor(200000)).toBe('RTGS');
  });
});

describe('job progress', () => {
  it('is the share of completed deliverables', () => {
    const job = createSeed().jobs[0];
    expect(jobProgress(job)).toEqual({ done: 3, total: 5, percent: 60 });
  });
});

describe('department budgets', () => {
  it('splits approved spend from pending commitments', () => {
    const production = departmentBudgets(createSeed().expenses).find((d) => d.department === 'Production')!;
    expect(production.spent).toBe(360000);
    expect(production.committed).toBe(650000 + 240000);
  });
});

describe('id generation', () => {
  it('continues from the highest number', () => {
    expect(nextId([{ id: 'L-101' }, { id: 'L-108' }], (x) => x.id, 'L-', 3)).toBe('L-109');
  });
  it('letters job orders per event', () => {
    expect(nextJobNumber(createSeed().jobs, 'EV-2026-CHE01')).toBe('JO-2026-CHE01-C');
  });
});
