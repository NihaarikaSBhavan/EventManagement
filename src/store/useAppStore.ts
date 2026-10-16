import { create } from 'zustand';
import { addDays, formatRange, nowStamp, TODAY } from '@/lib/dates';
import { formatINR, formatNumber } from '@/lib/format';
import { CITY_CODE, DEPOT_SHORT, HIGH_VALUE_EXPENSE } from '@/domain/constants';
import { can, canDecideExpense, PERSONAS, type Permission } from '@/domain/rbac';
import { createSeed } from '@/domain/seed';
import {
  documentTotal, invoiceTotals, jobProgress, nextId, nextJobNumber, payBreakdown, reserveGear, transferModeFor,
} from '@/domain/selectors';
import type {
  BillingMilestone, City, Dataset, Department, Employee, EventStatus, ExpenseProcess, ExpenseStatus, GearRequest, GstRate,
  InventoryItem, InvoiceStatus, JobOrder, JobPriority, JobStage, Lead, LeadStage, LineItem, PayStatus, Persona,
  ProductionEvent, Vendor, VendorStatus,
} from '@/domain/types';

export type ActionResult = { ok: boolean; message: string; tone?: 'success' | 'warning' | 'error' };

const ok = (message: string, tone: ActionResult['tone'] = 'success'): ActionResult => ({ ok: true, message, tone });
const denied = (message: string): ActionResult => ({ ok: false, message, tone: 'error' });

export type LeadInput = Omit<Lead, 'id' | 'convertedTo'>;
export type ItemInput = Omit<InventoryItem, 'id' | 'shortName'>;
export type VendorInput = Omit<Vendor, 'id' | 'totalSpend' | 'activePOs'>;
export type EnrollInput = Pick<Employee, 'name' | 'designation' | 'department' | 'reportsTo' | 'teamLead' | 'location' | 'basic' | 'hra' | 'siteAllowance' | 'leaveBalance' | 'pan'> & { bankName: string; accountNumber: string };
export type InvoiceInput = { eventCode: string; milestone: BillingMilestone; lines: LineItem[]; gst: GstRate; issuedOn: string; dueOn: string };
export type BillInput = { vendor: string; eventCode: string; lines: LineItem[]; gst: GstRate; dueOn: string };
export type ExpenseInput = { description: string; department: Department; process: ExpenseProcess; eventCode: string; amount: number; date: string };
export type EventInput = Omit<ProductionEvent, 'code'>;
export type JobInput = Omit<JobOrder, 'no' | 'stage' | 'gear' | 'deliverables'> & { deliverables: string[]; gear: GearRequest };

interface AppState {
  data: Dataset;
  personaId: string;
  persona: () => Persona;
  allowed: (p: Permission) => boolean;
  setPersona: (id: string) => ActionResult;
  resetDemo: () => ActionResult;

  saveLead: (input: LeadInput, id?: string) => ActionResult;
  setLeadStage: (id: string, stage: LeadStage) => ActionResult;
  convertLead: (id: string) => ActionResult;

  registerItem: (input: ItemInput) => ActionResult;
  stockIn: (id: string, qty?: number) => ActionResult;

  registerVendor: (input: VendorInput) => ActionResult;
  setVendorStatus: (id: string, status: VendorStatus) => ActionResult;

  advancePay: (code: string, to: PayStatus) => ActionResult;
  advancePayBulk: (from: PayStatus, to: PayStatus) => ActionResult;
  sendPayslip: (code: string) => ActionResult;
  enroll: (input: EnrollInput) => ActionResult;

  createInvoice: (input: InvoiceInput) => ActionResult;
  createBill: (input: BillInput) => ActionResult;
  setInvoiceStatus: (no: string, status: InvoiceStatus) => ActionResult;
  releaseBill: (no: string) => ActionResult;
  recordExpense: (input: ExpenseInput) => ActionResult;
  decideExpense: (id: string, status: Exclude<ExpenseStatus, 'Pending Approval'>) => ActionResult;

  scheduleEvent: (input: EventInput) => ActionResult;
  setEventStatus: (code: string, status: EventStatus) => ActionResult;

  createJob: (input: JobInput) => ActionResult;
  moveJob: (no: string, stage: JobStage) => ActionResult;
  toggleDeliverable: (no: string, deliverableId: string) => ActionResult;
}

function eventCodeFor(events: ProductionEvent[], city: string, startIso: string) {
  const year = startIso.slice(0, 4);
  return `EV-${year}-${CITY_CODE[city] ?? city.slice(0, 3).toUpperCase()}${String(events.length + 1).padStart(2, '0')}`;
}

function disburse(e: Employee): Employee {
  const mode = transferModeFor(payBreakdown(e).net);
  const utr = `${mode === 'RTGS' ? 'HDFCR5' : 'HDFCN5'}${TODAY.replace(/-/g, '')}${Math.floor(100000 + Math.random() * 899999)}`;
  return { ...e, payStatus: 'Disbursed', transfer: { mode, utr, at: nowStamp() } };
}

export const useAppStore = create<AppState>()((set, get) => {
  const mutate = (fn: (d: Dataset) => Partial<Dataset>) => set((s) => ({ data: { ...s.data, ...fn(s.data) } }));
  const guard = (p: Permission, message: string): ActionResult | null => (get().allowed(p) ? null : denied(message));

  return {
    data: createSeed(),
    personaId: 'u1',
    persona: () => PERSONAS.find((p) => p.id === get().personaId) ?? PERSONAS[0],
    allowed: (p) => can(get().persona().role, p),

    setPersona: (id) => {
      set({ personaId: id });
      const p = get().persona();
      return ok(`Now acting as ${p.name} · ${p.role}`);
    },
    resetDemo: () => {
      set({ data: createSeed() });
      return ok('Demo data restored');
    },

    // ---------------- CRM
    saveLead: (input, id) => {
      if (id) {
        mutate((d) => ({ leads: d.leads.map((l) => (l.id === id ? { ...l, ...input } : l)) }));
        return ok(`${id} dossier updated`);
      }
      const newId = nextId(get().data.leads, (l) => l.id, 'L-', 3);
      mutate((d) => ({ leads: [{ ...input, id: newId, convertedTo: null }, ...d.leads] }));
      return ok(`${newId} · ${input.organization} added to the pipeline`);
    },
    setLeadStage: (id, stage) => {
      mutate((d) => ({ leads: d.leads.map((l) => (l.id === id ? { ...l, stage } : l)) }));
      return ok(`${id} moved to ${stage}`);
    },
    convertLead: (id) => {
      const blocked = guard('lead.convert', 'Converting a lead needs MANAGER or above');
      if (blocked) return blocked;
      const { data } = get();
      const lead = data.leads.find((l) => l.id === id);
      if (!lead || lead.stage !== 'Closed Won' || lead.convertedTo) return denied('Only un-converted Closed Won leads can be converted');
      const start = addDays(TODAY, 28);
      const code = eventCodeFor(data.events, lead.city, start);
      const { granted, shortfall } = reserveGear(lead.gear, data.inventory, data.jobs);
      const event: ProductionEvent = {
        code, title: lead.product, client: lead.organization, venue: `Venue to be confirmed · ${lead.city}`, city: lead.city as City,
        venueSpec: `Pending site recce · requested kit: ${lead.kits || '—'}`, start, end: addDays(start, 1), status: 'Planning',
        budget: lead.value, capacity: 0, lead: lead.executive, format: `Converted from ${lead.id}`,
      };
      const job: JobOrder = {
        no: nextJobNumber(data.jobs, code), title: 'Production kick-off & gear reservation', eventCode: code, department: 'Production',
        executive: lead.executive, teamLead: 'Hariprasad Nair', manager: 'Senthil Kumar', priority: 'High', stage: 'Open', due: addDays(start, -7),
        gear: granted,
        deliverables: ['Client kick-off call & run-of-show brief', 'Venue shortlist & site recce', 'Confirm reserved gear at depot', 'Issue production budget to Finance']
          .map((text, i) => ({ id: `${code}-d${i}`, text, done: false })),
      };
      mutate((d) => ({ events: [...d.events, event], jobs: [...d.jobs, job], leads: d.leads.map((l) => (l.id === id ? { ...l, convertedTo: code } : l)) }));
      if (shortfall.length) {
        const s = shortfall.map((x) => `${x.item.shortName} ${x.granted}/${x.requested}`).join(', ');
        return ok(`${code} and ${job.no} created · partial reservation: ${s}`, 'warning');
      }
      return ok(`${code} and ${job.no} created · ${granted.length} gear lines reserved`);
    },

    // ---------------- Inventory
    registerItem: (input) => {
      const blocked = guard('inventory.register', 'Registering equipment needs MANAGER or above');
      if (blocked) return blocked;
      const id = nextId(get().data.inventory, (i) => i.id, 'INV-', 2);
      mutate((d) => ({ inventory: [...d.inventory, { ...input, id, shortName: input.name }] }));
      return ok(`${id} registered at ${DEPOT_SHORT[input.depot]} · ${formatNumber(input.total)} units`);
    },
    stockIn: (id, qty = 5) => {
      const blocked = guard('inventory.stockIn', 'Stock-in needs TEAM_LEAD or above');
      if (blocked) return blocked;
      const item = get().data.inventory.find((i) => i.id === id);
      if (!item) return denied('Item not found');
      mutate((d) => ({ inventory: d.inventory.map((i) => (i.id === id ? { ...i, total: i.total + qty } : i)) }));
      return ok(`+${qty} ${item.name} received at ${DEPOT_SHORT[item.depot]}`);
    },

    // ---------------- Vendors
    registerVendor: (input) => {
      const blocked = guard('vendor.register', 'Registering vendors needs MANAGER or above');
      if (blocked) return blocked;
      const id = nextId(get().data.vendors, (v) => v.id, 'V-', 2);
      mutate((d) => ({ vendors: [...d.vendors, { ...input, id, totalSpend: 0, activePOs: 0 }] }));
      return ok(`${input.name} registered · ${input.status}`);
    },
    setVendorStatus: (id, status) => {
      const blocked = guard('vendor.setStatus', 'Contractor sign-off needs DEPT_HEAD or MD_CEO');
      if (blocked) return blocked;
      const v = get().data.vendors.find((x) => x.id === id);
      mutate((d) => ({ vendors: d.vendors.map((x) => (x.id === id ? { ...x, status } : x)) }));
      return ok(`${v?.name} → ${status}`);
    },

    // ---------------- Payroll & HR
    advancePay: (code, to) => {
      const perm: Permission = to === 'Pending Approval' ? 'payroll.submit' : to === 'Approved' ? 'payroll.approve' : 'payroll.disburse';
      const blocked = guard(perm, to === 'Pending Approval' ? 'Payroll submission needs MANAGER or above' : 'Only MD_CEO and DEPT_HEAD can authorize or disburse salaries');
      if (blocked) return blocked;
      const e = get().data.employees.find((x) => x.code === code);
      if (!e) return denied('Employee not found');
      const next = to === 'Disbursed' ? disburse(e) : { ...e, payStatus: to };
      mutate((d) => ({ employees: d.employees.map((x) => (x.code === code ? next : x)) }));
      return to === 'Disbursed'
        ? ok(`${formatINR(payBreakdown(e).net)} sent to ${e.name} via ${next.transfer!.mode} · UTR ${next.transfer!.utr}`)
        : ok(`${e.name} · ${to}`);
    },
    advancePayBulk: (from, to) => {
      const perm: Permission = to === 'Pending Approval' ? 'payroll.submit' : 'payroll.approve';
      const blocked = guard(perm, 'You do not have payroll authority for this step');
      if (blocked) return blocked;
      const targets = get().data.employees.filter((e) => e.payStatus === from);
      if (!targets.length) return denied(`No payslips in ${from}`);
      const total = targets.reduce((s, e) => s + payBreakdown(e).net, 0);
      mutate((d) => ({ employees: d.employees.map((e) => (e.payStatus !== from ? e : to === 'Disbursed' ? disburse(e) : { ...e, payStatus: to })) }));
      return ok(`${targets.length} payslips → ${to}${to === 'Disbursed' ? ` · ${formatINR(total)} released via NEFT / RTGS` : ''}`);
    },
    sendPayslip: (code) => {
      const e = get().data.employees.find((x) => x.code === code);
      mutate((d) => ({ employees: d.employees.map((x) => (x.code === code ? { ...x, payslipSentAt: nowStamp() } : x)) }));
      return ok(`Payslip emailed to ${e?.name}`);
    },
    enroll: (input) => {
      const blocked = guard('staff.enroll', 'Enrolling personnel needs DEPT_HEAD or above');
      if (blocked) return blocked;
      const code = nextId(get().data.employees, (e) => e.code, 'EMS-', 3);
      const gross = input.basic + input.hra + input.siteAllowance;
      const employee: Employee = {
        code, name: input.name, designation: input.designation, department: input.department, reportsTo: input.reportsTo,
        teamLead: input.teamLead, attendance: 100, leaveBalance: input.leaveBalance, location: input.location,
        basic: input.basic, hra: input.hra, siteAllowance: input.siteAllowance, tds: Math.round(gross * 0.08), pf: Math.round(input.basic * 0.12),
        payStatus: 'Draft', bankMasked: `${input.bankName} ••••${input.accountNumber.slice(-4)}`, pan: input.pan.toUpperCase(),
        transfer: null, payslipSentAt: null,
      };
      mutate((d) => ({ employees: [...d.employees, employee] }));
      return ok(`${code} · ${input.name} enrolled · payroll draft created`);
    },

    // ---------------- Finance
    createInvoice: (input) => {
      const blocked = guard('invoice.create', 'Customer invoicing needs MANAGER or above');
      if (blocked) return blocked;
      const { data } = get();
      const event = data.events.find((e) => e.code === input.eventCode);
      const no = nextId(data.invoices, (i) => i.no, 'INV-AR-2026-', 4);
      mutate((d) => ({ invoices: [{ ...input, no, client: event?.client ?? '', status: 'Pending', settledAt: null }, ...d.invoices] }));
      return ok(`${no} raised on ${event?.client} · ${formatINR(invoiceTotals(input.lines, input.gst).total)}`);
    },
    createBill: (input) => {
      const blocked = guard('invoice.create', 'Logging vendor bills needs MANAGER or above');
      if (blocked) return blocked;
      const no = nextId(get().data.bills, (b) => b.no, 'AP-2026-', 4);
      const description = input.lines[0].description + (input.lines.length > 1 ? ` + ${input.lines.length - 1} more` : '');
      mutate((d) => ({ bills: [{ ...input, no, description, status: 'Pending', settledAt: null }, ...d.bills] }));
      return ok(`${no} logged for ${input.vendor} · ${formatINR(invoiceTotals(input.lines, input.gst).total)}`);
    },
    setInvoiceStatus: (no, status) => {
      const blocked = guard('invoice.setStatus', 'Updating collections needs MANAGER or above');
      if (blocked) return blocked;
      mutate((d) => ({ invoices: d.invoices.map((i) => (i.no === no ? { ...i, status, settledAt: status === 'Paid' ? nowStamp() : null } : i)) }));
      return ok(`${no} → ${status}${status === 'Paid' ? ' · collection posted' : ''}`);
    },
    releaseBill: (no) => {
      const blocked = guard('bill.release', 'Vendor payment release needs DEPT_HEAD or MD_CEO');
      if (blocked) return blocked;
      const bill = get().data.bills.find((b) => b.no === no);
      if (!bill) return denied('Bill not found');
      mutate((d) => ({ bills: d.bills.map((b) => (b.no === no ? { ...b, status: 'Paid', settledAt: nowStamp() } : b)) }));
      return ok(`${formatINR(documentTotal(bill))} released to ${bill.vendor}`);
    },
    recordExpense: (input) => {
      const blocked = guard('expense.record', 'Recording expenses needs TEAM_LEAD or above');
      if (blocked) return blocked;
      const id = nextId(get().data.expenses, (e) => e.id, 'EXP-', 4);
      mutate((d) => ({ expenses: [{ ...input, id, status: 'Pending Approval', raisedBy: get().persona().name, decidedBy: null }, ...d.expenses] }));
      return ok(`${id} recorded · routed to ${input.amount > HIGH_VALUE_EXPENSE ? 'MD_CEO for sign-off' : 'DEPT_HEAD'}`);
    },
    decideExpense: (id, status) => {
      const e = get().data.expenses.find((x) => x.id === id);
      if (!e) return denied('Expense not found');
      if (!canDecideExpense(get().persona().role, e.amount)) {
        return denied(e.amount > HIGH_VALUE_EXPENSE ? 'Above ₹5,00,000 — MD_CEO sign-off required' : 'Expense approval needs DEPT_HEAD or MD_CEO');
      }
      mutate((d) => ({ expenses: d.expenses.map((x) => (x.id === id ? { ...x, status, decidedBy: get().persona().name } : x)) }));
      return ok(`${id} ${status.toLowerCase()} · ${formatINR(e.amount)}`, status === 'Approved' ? 'success' : 'warning');
    },

    // ---------------- Events
    scheduleEvent: (input) => {
      const blocked = guard('event.schedule', 'Scheduling needs MANAGER or above');
      if (blocked) return blocked;
      const code = eventCodeFor(get().data.events, input.city, input.start);
      mutate((d) => ({ events: [...d.events, { ...input, code }] }));
      return ok(`${code} scheduled · ${formatRange(input.start, input.end)}`);
    },
    setEventStatus: (code, status) => {
      const blocked = guard('event.setStatus', 'Event status changes need MANAGER or above');
      if (blocked) return blocked;
      mutate((d) => ({ events: d.events.map((e) => (e.code === code ? { ...e, status } : e)) }));
      return ok(`${code} → ${status}`);
    },

    // ---------------- Job orders
    createJob: (input) => {
      const blocked = guard('job.create', 'Creating job orders needs MANAGER or above');
      if (blocked) return blocked;
      const { data } = get();
      const no = nextJobNumber(data.jobs, input.eventCode);
      const { granted, shortfall } = reserveGear(input.gear, data.inventory, data.jobs);
      const job: JobOrder = {
        ...input, no, stage: 'Open', gear: granted,
        deliverables: input.deliverables.map((text, i) => ({ id: `${no}-d${i}`, text, done: false })),
      };
      mutate((d) => ({ jobs: [...d.jobs, job] }));
      return shortfall.length
        ? ok(`${no} created · short on ${shortfall.map((x) => `${x.item.shortName} ${x.granted}/${x.requested}`).join(', ')}`, 'warning')
        : ok(`${no} created · ${granted.length} gear lines reserved`);
    },
    moveJob: (no, stage) => {
      const job = get().data.jobs.find((j) => j.no === no);
      if (!job || job.stage === stage) return denied('Nothing to move');
      if (stage === 'Completed' && !get().allowed('job.verify')) return denied(`Completion needs TEAM_LEAD verification — ${no} stays in ${job.stage}`);
      mutate((d) => ({ jobs: d.jobs.map((j) => (j.no === no ? { ...j, stage } : j)) }));
      return ok(`${no} → ${stage}${stage === 'Completed' ? ' · gear released to depot' : ''}`);
    },
    toggleDeliverable: (no, deliverableId) => {
      const job = get().data.jobs.find((j) => j.no === no);
      if (!job) return denied('Job order not found');
      if (job.stage === 'Completed') return denied('Completed orders are locked');
      const deliverables = job.deliverables.map((d) => (d.id === deliverableId ? { ...d, done: !d.done } : d));
      const { percent } = jobProgress({ ...job, deliverables });
      let stage: JobStage = job.stage;
      if (percent === 100 && ['Open', 'In Progress', 'Overdue'].includes(stage)) stage = 'Pending Review';
      else if (percent < 100 && stage === 'Pending Review') stage = 'In Progress';
      else if (stage === 'Open' && percent > 0) stage = 'In Progress';
      mutate((d) => ({ jobs: d.jobs.map((j) => (j.no === no ? { ...j, deliverables, stage } : j)) }));
      return stage === 'Pending Review' && job.stage !== 'Pending Review'
        ? ok(`${no} reached 100% — sent to Pending Review for TEAM_LEAD QC`)
        : { ok: true, message: '' };
    },
  };
});

export type { JobPriority };
