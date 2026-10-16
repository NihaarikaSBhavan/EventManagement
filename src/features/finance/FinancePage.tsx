import { Check, FileWarning, Lock, Plus, Receipt, Send, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/Feedback';
import { Select } from '@/components/ui/Field';
import { Stat } from '@/components/ui/Stat';
import { Meta, Status } from '@/components/ui/Status';
import { PageTabs } from '@/components/ui/Tabs';
import { GatedButton } from '@/components/shared/Gate';
import { PageHeader } from '@/components/shared/PageHeader';
import { DEPARTMENTS, HIGH_VALUE_EXPENSE, PROCESSES } from '@/domain/constants';
import { canDecideExpense } from '@/domain/rbac';
import { departmentBudgets, documentTotal, receivables } from '@/domain/selectors';
import { expenseTone, invoiceTone } from '@/domain/tones';
import type { CustomerInvoice, Department, Expense, ExpenseProcess, InvoiceStatus, VendorBill } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { useCan, usePersona } from '@/hooks/usePermission';
import { daysBetween, formatDate, formatStamp, TODAY } from '@/lib/dates';
import { formatINR, formatNumber, percent } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { BudgetTable } from './BudgetTable';
import { ExpenseDialog } from './ExpenseDialog';
import { InvoiceDialog } from './InvoiceDialog';

type Tab = 'ar' | 'ap' | 'expenses';

export function FinancePage() {
  const data = useAppStore((s) => s.data);
  const setInvoiceStatus = useAppStore((s) => s.setInvoiceStatus);
  const releaseBill = useAppStore((s) => s.releaseBill);
  const decide = useAppStore((s) => s.decideExpense);
  const persona = usePersona();
  const canView = useCan('finance.view');
  const canRelease = useCan('bill.release');
  const canBudget = useCan('budget.oversee');
  const { openEvent } = useEntityLinks();
  const [tab, setTab] = useState<Tab>('ar');
  const [dept, setDept] = useState<'All' | Department>('All');
  const [proc, setProc] = useState<'All' | ExpenseProcess>('All');
  const [invoiceOpen, setInvoiceOpen] = useState<null | 'AR' | 'AP'>(null);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const ar = useMemo(() => receivables(data.invoices, TODAY), [data.invoices]);
  const expenses = data.expenses.filter((e) => (dept === 'All' || e.department === dept) && (proc === 'All' || e.process === proc));
  const eventTitle = (code: string) => data.events.find((e) => e.code === code)?.title ?? code;

  if (!canView) {
    return (
      <>
        <PageHeader title="Finance & invoicing" />
        <Card>
          <EmptyState icon={Lock} title="Finance is restricted to MANAGER and above"
            description={`You are signed in as ${persona.role}. Invoices, collections and expense approvals are hidden at this tier — switch role in the sidebar to preview higher tiers.`}
            action={<Link to="/" className="text-xs font-medium text-primary hover:underline">Back to dashboard</Link>} />
        </Card>
      </>
    );
  }

  const arColumns: Column<CustomerInvoice>[] = [
    { id: 'no', header: 'Invoice', sortValue: (i) => i.no, cell: (i) => <span className="font-mono text-xs font-medium">{i.no}</span> },
    { id: 'event', header: 'Event · client', sortValue: (i) => i.client, cell: (i) => <div><button type="button" className="font-medium hover:text-primary hover:underline" onClick={() => openEvent(i.eventCode)}>{eventTitle(i.eventCode)}</button><Meta className="block" items={[<span key="c" className="font-mono">{i.eventCode}</span>, i.client]} /></div> },
    { id: 'mile', header: 'Milestone', sortValue: (i) => i.milestone, cell: (i) => <span className="text-fg-muted">{i.milestone}</span> },
    { id: 'issued', header: 'Issued', sortValue: (i) => i.issuedOn, cell: (i) => formatDate(i.issuedOn) },
    { id: 'due', header: 'Due', sortValue: (i) => i.dueOn, cell: (i) => formatDate(i.dueOn) },
    {
      id: 'aging', header: 'Aging', align: 'right', sortValue: (i) => (i.status === 'Paid' ? -1 : daysBetween(i.issuedOn, TODAY)),
      cell: (i) => i.status === 'Paid' ? <span className="text-fg-subtle">—</span> : <span className={`font-mono text-xs ${daysBetween(i.dueOn, TODAY) > 30 ? 'font-semibold text-danger' : ''}`}>{daysBetween(i.issuedOn, TODAY)} d</span>,
    },
    { id: 'amount', header: 'Amount incl. GST', align: 'right', sortValue: documentTotal, cell: (i) => <span className="font-medium tabular">{formatINR(documentTotal(i))}</span> },
    { id: 'status', header: 'Status', width: '150px', sortValue: (i) => i.status, cell: (i) => <Select aria-label={`Status of ${i.no}`} value={i.status} options={['Paid', 'Pending', 'Overdue']} onChange={(e) => notify(setInvoiceStatus(i.no, e.target.value as InvoiceStatus))} /> },
    { id: 'settled', header: 'Settled', sortValue: (i) => i.settledAt ?? '', cell: (i) => <span className="text-xs text-fg-subtle">{formatStamp(i.settledAt)}</span> },
  ];

  const apColumns: Column<VendorBill>[] = [
    { id: 'no', header: 'Bill', sortValue: (b) => b.no, cell: (b) => <span className="font-mono text-xs font-medium">{b.no}</span> },
    { id: 'vendor', header: 'Vendor', sortValue: (b) => b.vendor, cell: (b) => <span className="font-medium">{b.vendor}</span> },
    { id: 'event', header: 'Event', cell: (b) => <span className="font-mono text-xs text-fg-muted">{b.eventCode}</span> },
    { id: 'desc', header: 'Description', cell: (b) => <div><p>{b.description}</p><p className="text-2xs text-fg-subtle">{b.lines.map((l) => `${formatNumber(l.qty)} × ${formatINR(l.rate)}`).join(' + ')} · GST {b.gst}%</p></div> },
    { id: 'due', header: 'Due', sortValue: (b) => b.dueOn, cell: (b) => formatDate(b.dueOn) },
    { id: 'amount', header: 'Amount', align: 'right', sortValue: documentTotal, cell: (b) => <span className="font-medium tabular">{formatINR(documentTotal(b))}</span> },
    { id: 'status', header: 'Status', sortValue: (b) => b.status, cell: (b) => <Status tone={invoiceTone[b.status]}>{b.status}</Status> },
    {
      id: 'action', header: '', width: '190px',
      cell: (b) => b.status === 'Paid'
        ? <span className="text-xs text-fg-subtle">{formatStamp(b.settledAt)}</span>
        : <div className="flex justify-end"><GatedButton permission="bill.release" size="sm" variant="success" onClick={() => notify(releaseBill(b.no))}><Send />Release payment</GatedButton></div>,
    },
  ];

  const expColumns: Column<Expense>[] = [
    { id: 'id', header: 'Expense', sortValue: (e) => e.date, cell: (e) => <div><p className="font-mono text-xs font-medium">{e.id}</p><p className="text-2xs text-fg-subtle">{formatDate(e.date)}</p></div> },
    { id: 'desc', header: 'Description', cell: (e) => e.description },
    { id: 'dept', header: 'Department', sortValue: (e) => e.department, cell: (e) => <span className="text-fg-muted">{e.department}</span> },
    { id: 'proc', header: 'Process', sortValue: (e) => e.process, cell: (e) => <span className="text-fg-muted">{e.process}</span> },
    { id: 'event', header: 'Event', cell: (e) => <span className="font-mono text-xs text-fg-muted">{e.eventCode}</span> },
    { id: 'by', header: 'Raised by', sortValue: (e) => e.raisedBy, cell: (e) => e.raisedBy },
    { id: 'amount', header: 'Amount', align: 'right', sortValue: (e) => e.amount, cell: (e) => <span className={`font-medium tabular ${e.amount > HIGH_VALUE_EXPENSE ? 'text-warning' : ''}`}>{formatINR(e.amount)}</span> },
    {
      id: 'status', header: 'Status', width: '230px', sortValue: (e) => e.status,
      cell: (e) => {
        if (e.status !== 'Pending Approval') return <div><Status tone={expenseTone[e.status]}>{e.status}</Status>{e.decidedBy && <p className="mt-0.5 text-2xs text-fg-subtle">by {e.decidedBy}</p>}</div>;
        if (!canDecideExpense(persona.role, e.amount)) return <div><Status tone="warning">Pending</Status><p className="mt-0.5 text-2xs text-fg-subtle">Needs {e.amount > HIGH_VALUE_EXPENSE ? 'MD_CEO' : 'DEPT_HEAD'} sign-off</p></div>;
        return (
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="success" onClick={() => notify(decide(e.id, 'Approved'))}><Check />Approve</Button>
            <Button size="sm" variant="danger" onClick={() => notify(decide(e.id, 'Rejected'))}><X />Reject</Button>
          </div>
        );
      },
    },
  ];

  const procTotals = PROCESSES.map((p) => {
    const rows = expenses.filter((e) => e.process === p && e.status !== 'Rejected');
    return { p, total: rows.reduce((s, e) => s + e.amount, 0), n: rows.length };
  });
  const billsOpen = data.bills.filter((b) => b.status !== 'Paid');

  return (
    <>
      <PageHeader
        title="Finance, invoicing & expenses"
        description="Dual invoicing tracks — customer receivables and vendor payables — with debt aging and departmental expense auditing."
        actions={<>
          <GatedButton permission="expense.record" onClick={() => setExpenseOpen(true)}>Record expense</GatedButton>
          <GatedButton permission="invoice.create" variant="primary" onClick={() => setInvoiceOpen(tab === 'ap' ? 'AP' : 'AR')}><Plus />Create invoice</GatedButton>
        </>}
      >
        <PageTabs value={tab} onChange={setTab} options={[
          { value: 'ar', label: 'Customer invoices · AR', count: data.invoices.length },
          { value: 'ap', label: 'Vendor & internal bills · AP', count: data.bills.length },
          { value: 'expenses', label: 'Departmental expenses', count: data.expenses.length },
        ]} />
      </PageHeader>

      {tab === 'ar' && (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Total invoiced" icon={Receipt} value={formatINR(ar.invoiced)} footnote={`${data.invoices.length} customer invoices`} />
            <Stat label="Actually collected" tone="success" value={formatINR(ar.collected)} footnote={`${percent(ar.collected, ar.invoiced)}% realized`} />
            <Stat label="Pending clearance" tone="warning" value={formatINR(ar.pending)} footnote="within credit terms" />
            <Stat label="Overdue > 30 days" icon={FileWarning} tone="danger" value={formatINR(ar.overdueOver30)} footnote={`${formatINR(ar.overdue)} overdue in total`} />
          </section>
          <Card><DataTable rows={data.invoices} columns={arColumns} rowKey={(i) => i.no} minWidth={1320} /></Card>
        </>
      )}

      {tab === 'ap' && (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Payable" tone="warning" value={formatINR(billsOpen.reduce((s, b) => s + documentTotal(b), 0))} footnote={`${billsOpen.length} open bills`} />
            <Stat label="Overdue to vendors" tone="danger" value={formatINR(data.bills.filter((b) => b.status === 'Overdue').reduce((s, b) => s + documentTotal(b), 0))} footnote="release first to protect terms" />
            <Stat label="Released" tone="success" value={formatINR(data.bills.filter((b) => b.status === 'Paid').reduce((s, b) => s + documentTotal(b), 0))} footnote={canRelease ? 'you can release payments' : 'releases need DEPT_HEAD+'} />
          </section>
          <Card><DataTable rows={data.bills} columns={apColumns} rowKey={(b) => b.no} minWidth={1240} /></Card>
        </>
      )}

      {tab === 'expenses' && (
        <>
          <Card className="flex flex-wrap items-center gap-3 p-3">
            <Select aria-label="Filter by department" className="w-56" value={dept} onChange={(e) => setDept(e.target.value as typeof dept)} options={[{ value: 'All', label: 'All departments' }, ...DEPARTMENTS]} />
            <Select aria-label="Filter by process" className="w-56" value={proc} onChange={(e) => setProc(e.target.value as typeof proc)} options={[{ value: 'All', label: 'All processes' }, ...PROCESSES]} />
            <p className="ml-auto text-xs text-fg-subtle">{expenses.length} expenses · <span className="tabular">{formatINR(expenses.reduce((s, e) => s + e.amount, 0))}</span> · <span className="tabular">{formatINR(expenses.filter((e) => e.status === 'Pending Approval').reduce((s, e) => s + e.amount, 0))}</span> awaiting approval</p>
          </Card>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {procTotals.map((p) => (
              <Card key={p.p} className="p-3">
                <p className="text-xs text-fg-muted">{p.p}</p>
                <p className="mt-1 text-base font-semibold tabular">{formatINR(p.total)}</p>
                <p className="text-2xs text-fg-subtle">{p.n} {p.n === 1 ? 'entry' : 'entries'}</p>
              </Card>
            ))}
          </section>
          <Card><DataTable rows={expenses} columns={expColumns} rowKey={(e) => e.id} minWidth={1300} empty={<EmptyState icon={Receipt} title="No expenses match" />} /></Card>
          {canBudget && (
            <Card>
              <CardHeader title="Department budgets · Q3 FY 2026–27" description="Spent = approved · committed = awaiting approval" />
              <div className="mt-3"><BudgetTable rows={departmentBudgets(data.expenses)} /></div>
            </Card>
          )}
        </>
      )}

      <InvoiceDialog track={invoiceOpen} onClose={(next) => { setInvoiceOpen(null); if (next) setTab(next === 'AP' ? 'ap' : 'ar'); }} />
      <ExpenseDialog open={expenseOpen} onOpenChange={setExpenseOpen} onRecorded={() => setTab('expenses')} />
    </>
  );
}
