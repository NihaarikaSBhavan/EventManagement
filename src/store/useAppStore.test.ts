import { allocationByItem } from '@/domain/selectors';
import { useAppStore } from './useAppStore';

const store = () => useAppStore.getState();

beforeEach(() => {
  store().resetDemo();
  store().setPersona('u1');
});

describe('lead conversion', () => {
  it('creates an event and a job order and reserves gear within stock', () => {
    const before = store().data;
    const res = store().convertLead('L-104');
    expect(res.ok).toBe(true);
    const after = store().data;
    expect(after.events).toHaveLength(before.events.length + 1);
    const event = after.events.at(-1)!;
    expect(event.code).toBe('EV-2026-CBE08');
    const job = after.jobs.find((j) => j.eventCode === event.code)!;
    expect(job.no).toBe('JO-2026-CBE08-A');
    expect(job.gear).toContainEqual({ itemId: 'INV-01', qty: 20 });
    expect(allocationByItem(after.jobs)['INV-01']).toBe(240);
    expect(res.tone).toBe('warning');
    expect(after.leads.find((l) => l.id === 'L-104')!.convertedTo).toBe(event.code);
  });

  it('is refused for executives', () => {
    store().setPersona('u5');
    expect(store().convertLead('L-104').ok).toBe(false);
  });
});

describe('payroll lifecycle', () => {
  it('blocks managers from disbursing and stamps a UTR when MD disburses', () => {
    store().setPersona('u3');
    expect(store().advancePay('EMS-001', 'Disbursed').ok).toBe(false);
    store().setPersona('u1');
    expect(store().advancePay('EMS-001', 'Disbursed').ok).toBe(true);
    const md = store().data.employees.find((e) => e.code === 'EMS-001')!;
    expect(md.payStatus).toBe('Disbursed');
    expect(md.transfer?.mode).toBe('RTGS');
  });
});

describe('job checklist', () => {
  it('moves an order to Pending Review when every deliverable is done', () => {
    const job = store().data.jobs.find((j) => j.no === 'JO-2026-CHE01-A')!;
    job.deliverables.filter((d) => !d.done).forEach((d) => store().toggleDeliverable(job.no, d.id));
    expect(store().data.jobs.find((j) => j.no === job.no)!.stage).toBe('Pending Review');
  });

  it('requires TEAM_LEAD to complete', () => {
    store().setPersona('u5');
    expect(store().moveJob('JO-2026-CHE01-B', 'Completed').ok).toBe(false);
    store().setPersona('u4');
    expect(store().moveJob('JO-2026-CHE01-B', 'Completed').ok).toBe(true);
  });
});

describe('collections', () => {
  it('marking an invoice paid stamps a settlement time', () => {
    store().setInvoiceStatus('INV-AR-2026-0162', 'Paid');
    expect(store().data.invoices.find((i) => i.no === 'INV-AR-2026-0162')!.settledAt).toMatch(/^2026-10-16T/);
  });
});
