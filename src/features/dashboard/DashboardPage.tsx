import { AlertTriangle, ArrowUpRight, Banknote, CalendarRange, Clock, Landmark, TrendingUp, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Callout } from '@/components/ui/Feedback';
import { Progress, SegmentedBar } from '@/components/ui/Progress';
import { Stat } from '@/components/ui/Stat';
import { Meta, Status } from '@/components/ui/Status';
import { PageHeader } from '@/components/shared/PageHeader';
import { DEPOT_CITY, DEPOT_SHORT, DEPOTS, HIGH_VALUE_EXPENSE, JOB_STAGES, OPEN_LEAD_STAGES, OPENING_BALANCE } from '@/domain/constants';
import {
  allocationByItem, available, collectionsByMonth, departmentBudgets, isLate, operatingSummary, receivables,
} from '@/domain/selectors';
import { eventTone, jobTone } from '@/domain/tones';
import type { ProductionEvent } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { useCan, usePersona } from '@/hooks/usePermission';
import { daysBetween, formatDate, formatRange, MONTHS, TODAY } from '@/lib/dates';
import { formatINR, formatINRCompact, formatNumber, percent } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { BudgetTable } from '../finance/BudgetTable';

export function DashboardPage() {
  const data = useAppStore((s) => s.data);
  const decide = useAppStore((s) => s.decideExpense);
  const persona = usePersona();
  const canPnl = useCan('company.pnl');
  const canBudget = useCan('budget.oversee');
  const { openEvent, openJob } = useEntityLinks();

  const m = useMemo(() => {
    const ar = receivables(data.invoices, TODAY);
    const ops = operatingSummary(data, TODAY);
    const inProduction = data.events.filter((e) => e.status !== 'Completed');
    const byStatus = (s: ProductionEvent['status']) => data.events.filter((e) => e.status === s).length;
    const openLeads = data.leads.filter((l) => OPEN_LEAD_STAGES.includes(l.stage));
    const allocation = allocationByItem(data.jobs);
    const depots = DEPOTS.map((depot) => {
      const items = data.inventory.filter((i) => i.depot === depot);
      const ready = items.reduce((s, i) => s + available(i, allocation), 0);
      const total = items.reduce((s, i) => s + i.total, 0);
      return { depot, ready, total, items: items.map((i) => ({ name: i.shortName, ready: available(i, allocation), total: i.total })) };
    });
    const trend = collectionsByMonth(data.invoices).map((r) => ({ label: MONTHS[Number(r.month.slice(5)) - 1].slice(0, 3), amount: r.amount }));
    return {
      ar, ops, inProduction, openLeads, depots, trend,
      breakdown: { live: byStatus('Live/Active'), pre: byStatus('Pre-production'), planning: byStatus('Planning') },
      pipeline: openLeads.reduce((s, l) => s + l.value, 0),
      wonWaiting: data.leads.filter((l) => l.stage === 'Closed Won' && !l.convertedTo).length,
      upcoming: [...inProduction].sort((a, b) => a.start.localeCompare(b.start)),
      jobCounts: JOB_STAGES.map((stage) => ({ stage, count: data.jobs.filter((j) => j.stage === stage).length })),
      alerts: data.jobs.filter((j) => j.stage === 'Overdue' || isLate(j, TODAY)),
      vendorsActive: data.vendors.filter((v) => v.status !== 'Under Review').length,
      vendorsPreferred: data.vendors.filter((v) => v.status === 'Preferred').length,
      livePOs: data.vendors.reduce((s, v) => s + v.activePOs, 0),
      vendorSpend: data.vendors.reduce((s, v) => s + v.totalSpend, 0),
      topVendors: [...data.vendors].sort((a, b) => b.activePOs - a.activePOs || b.totalSpend - a.totalSpend).slice(0, 4),
      signoffs: data.expenses.filter((e) => e.status === 'Pending Approval' && e.amount > HIGH_VALUE_EXPENSE),
      budgets: departmentBudgets(data.expenses),
    };
  }, [data]);

  const feedColumns: Column<ProductionEvent>[] = [
    {
      id: 'event', header: 'Event', sortValue: (e) => e.title,
      cell: (e) => (
        <div className="min-w-0">
          <button type="button" onClick={() => openEvent(e.code)} className="font-medium text-fg hover:text-primary hover:underline">{e.title}</button>
          <Meta className="mt-0.5 block" items={[<span key="c" className="font-mono">{e.code}</span>, e.client]} />
        </div>
      ),
    },
    { id: 'venue', header: 'Venue', cell: (e) => <span className="text-fg-muted">{e.venue}</span> },
    { id: 'dates', header: 'Schedule', sortValue: (e) => e.start, cell: (e) => formatRange(e.start, e.end) },
    { id: 'status', header: 'Stage', sortValue: (e) => e.status, cell: (e) => <Status tone={eventTone[e.status]}>{e.status}</Status> },
    { id: 'budget', header: 'Budget', align: 'right', sortValue: (e) => e.budget, cell: (e) => <span className="font-medium tabular">{formatINR(e.budget)}</span> },
    {
      id: 'collected', header: 'Collected', width: '170px', sortValue: (e) => percent(m.ar.collectedByEvent[e.code] ?? 0, e.budget),
      cell: (e) => {
        const c = m.ar.collectedByEvent[e.code] ?? 0;
        const p = percent(c, e.budget);
        return (
          <div className="flex items-center gap-2">
            <Progress value={p} tone="success" className="flex-1" label={`${p}% collected`} />
            <span className="w-11 text-right font-mono text-xs text-fg-muted">{p}%</span>
          </div>
        );
      },
    },
    { id: 'lead', header: 'Lead executive', cell: (e) => <span className="text-fg-muted">{e.lead}</span> },
  ];

  return (
    <>
      <PageHeader
        title={`Good morning, ${persona.name.replace(/^K\. /, '').split(' ')[0]}`}
        description={`Operations across Chennai, Bengaluru, Hyderabad, Kochi, Coimbatore and Madurai · ${formatDate(TODAY)}`}
        actions={<Button variant="secondary" onClick={() => openEvent(m.upcoming[0]?.code ?? '')} disabled={!m.upcoming.length}><CalendarRange />Next production</Button>}
      />

      <section aria-label="Key indicators" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Events in production" icon={CalendarRange} value={m.inProduction.length}
          footnote={<Meta items={[`${m.breakdown.live} Live`, `${m.breakdown.pre} Pre-production`, `${m.breakdown.planning} Planning`]} />} />
        <Stat label="Payments actually collected" icon={Banknote} tone="success" value={formatINR(m.ar.collected)}
          footnote={`${percent(m.ar.collected, m.ar.invoiced)}% of ${formatINR(m.ar.invoiced)} invoiced`} />
        <Stat label="Pending & outstanding" icon={Clock} value={formatINR(m.ar.pending + m.ar.overdue)}
          footnote={m.ar.overdue > 0
            ? <span className="inline-flex items-center gap-1.5 font-medium text-danger"><AlertTriangle className="size-3.5" />{formatINR(m.ar.overdue)} overdue · {m.ar.overdueCount} invoices</span>
            : `${formatINR(m.ar.pending)} pending clearance`} />
        <Stat label="Active leads pipeline" icon={TrendingUp} value={formatINR(m.pipeline)}
          footnote={<Meta items={[`${m.openLeads.length} open leads`, `${m.wonWaiting} won awaiting conversion`]} />} />
      </section>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title="Realization health" description={`Customer receivables · ${formatINR(m.ar.invoiced)} invoiced to date`} />
          <CardBody className="flex flex-col gap-5">
            <SegmentedBar segments={[
              { value: m.ar.collected, className: 'bg-chart-1', label: 'Collected' },
              { value: m.ar.pending, className: 'bg-chart-2', label: 'Pending clearance' },
              { value: m.ar.overdue, className: 'bg-chart-3', label: 'Overdue' },
            ]} />
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: 'Actually collected', value: m.ar.collected, dot: 'bg-chart-1' },
                { label: 'Pending clearance', value: m.ar.pending, dot: 'bg-chart-2' },
                { label: 'Overdue receivables', value: m.ar.overdue, dot: 'bg-chart-3' },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="flex items-center gap-2 text-xs text-fg-muted"><span className={`size-2 rounded-sm ${s.dot}`} />{s.label}</dt>
                  <dd className="mt-1 text-base font-semibold tabular">{formatINR(s.value)}</dd>
                  <dd className="text-xs text-fg-subtle">{percent(s.value, m.ar.invoiced)}% of invoiced</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Collections by month" description="Settled customer invoices, incl. GST" />
          <div className="h-[168px] px-2 pb-3 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--line))" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--fg-subtle))' }} />
                <YAxis width={48} tickLine={false} axisLine={false} tickFormatter={formatINRCompact} tick={{ fontSize: 11, fill: 'hsl(var(--fg-subtle))' }} />
                <RTooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  formatter={(v: number) => [formatINR(v), 'Collected']}
                  contentStyle={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--line))', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(var(--fg-muted))' }}
                />
                <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {canPnl && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Card>
            <CardHeader title="Company P&L" description="FY 2026–27 to date · MD_CEO view" />
            <CardBody className="flex flex-col gap-2.5 text-[13px]">
              {[
                ['Collections (gross)', m.ops.revenue, false],
                ['Vendor payments released', -m.ops.billsPaid, true],
                ['Approved departmental expenses', -m.ops.expensesApproved, true],
                ['Payroll disbursed · Oct 2026', -m.ops.payrollDisbursed, true],
              ].map(([label, v, muted]) => (
                <div key={label as string} className={`flex justify-between ${muted ? 'text-fg-muted' : ''}`}><span>{label}</span><span className="tabular">{formatINR(v as number)}</span></div>
              ))}
              <div className="mt-1 flex justify-between border-t border-line pt-3 text-sm font-semibold">
                <span>Operating surplus</span>
                <span className={m.ops.surplus >= 0 ? 'text-success' : 'text-danger'}>{formatINR(m.ops.surplus)}</span>
              </div>
              <p className="text-xs text-fg-subtle">Committed, not yet paid: {formatINR(m.ops.billsOpen)} payables · {formatINR(m.ops.expensesPending)} awaiting approval</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Bank balances" description="Live operating position" />
            <ul className="divide-y divide-line/70 px-4 pb-2">
              {[
                { name: 'HDFC Bank · Current A/c', mask: '4821', bal: OPENING_BALANCE + m.ops.surplus, note: 'Operating · moves with settlements' },
                { name: 'ICICI Bank · Client Escrow', mask: '0937', bal: 62_40_000, note: 'Advance retention' },
                { name: 'State Bank of India · OD line', mask: '5512', bal: 2_50_00_000, note: 'Undrawn limit' },
              ].map((b) => (
                <li key={b.mask} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-subtle text-fg-subtle"><Landmark className="size-4" /></span>
                    <div className="min-w-0"><p className="truncate text-[13px] font-medium">{b.name}</p><Meta items={[<span key="m" className="font-mono">••{b.mask}</span>, b.note]} /></div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular">{formatINR(b.bal)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Awaiting your sign-off" description="Expenses above ₹5,00,000" />
            <div className="flex flex-col gap-3 p-4">
              {m.signoffs.map((e) => (
                <div key={e.id} className="rounded-lg border border-line p-3">
                  <div className="flex justify-between gap-3"><p className="text-[13px] font-medium">{e.description}</p><span className="shrink-0 text-[13px] font-semibold tabular">{formatINR(e.amount)}</span></div>
                  <Meta className="mt-1 block" items={[<span key="i" className="font-mono">{e.id}</span>, e.department, `by ${e.raisedBy}`]} />
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="success" onClick={() => notify(decide(e.id, 'Approved'))}>Sign off</Button>
                    <Button size="sm" variant="danger" onClick={() => notify(decide(e.id, 'Rejected'))}>Reject</Button>
                  </div>
                </div>
              ))}
              {m.signoffs.length === 0 && <p className="py-6 text-center text-xs text-fg-subtle">Nothing above ₹5,00,000 is waiting for you.</p>}
            </div>
          </Card>
        </div>
      )}

      {canBudget && (
        <Card>
          <CardHeader title="Department budget oversight" description="Q3 FY 2026–27 · spent = approved · committed = awaiting approval" />
          <div className="mt-3"><BudgetTable rows={m.budgets} /></div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card>
          <CardHeader title="Inventory depot availability" description={`${formatNumber(m.depots.reduce((s, d) => s + d.ready, 0))} units ready across four hubs`}
            action={<Link to="/inventory" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Inventory <ArrowUpRight className="size-3" /></Link>} />
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            {m.depots.map((d) => (
              <div key={d.depot} className="rounded-lg border border-line p-3">
                <div className="flex items-baseline justify-between"><span className="text-[13px] font-medium">{DEPOT_SHORT[d.depot]}</span><span className="text-xs text-fg-subtle">{DEPOT_CITY[d.depot]}</span></div>
                <p className="mt-2 text-lg font-semibold tabular">{formatNumber(d.ready)}<span className="ml-1 text-xs font-normal text-fg-subtle">/ {formatNumber(d.total)} ready</span></p>
                <Progress value={percent(d.ready, d.total)} tone="success" className="mt-2" label={`${DEPOT_SHORT[d.depot]} availability`} />
                <ul className="mt-2.5 space-y-1">
                  {d.items.map((i) => <li key={i.name} className="flex justify-between text-xs text-fg-subtle"><span>{i.name}</span><span className="tabular">{formatNumber(i.ready)} / {formatNumber(i.total)}</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Subcontractor partner network" description={`${m.vendorsActive} active vendors · ${m.vendorsPreferred} preferred · ${m.livePOs} live purchase orders`}
            action={<Link to="/vendors" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Vendors <ArrowUpRight className="size-3" /></Link>} />
          <div className="grid grid-cols-3 gap-3 px-4 pt-4">
            <div><p className="text-xs text-fg-muted">Total spend</p><p className="mt-1 text-base font-semibold tabular">{formatINR(m.vendorSpend)}</p></div>
            <div><p className="text-xs text-fg-muted">Live POs</p><p className="mt-1 text-base font-semibold tabular">{m.livePOs}</p></div>
            <div><p className="text-xs text-fg-muted">Under review</p><p className="mt-1 text-base font-semibold text-warning tabular">{data.vendors.length - m.vendorsActive}</p></div>
          </div>
          <ul className="mt-3 divide-y divide-line/70 border-t border-line px-4">
            {m.topVendors.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0"><p className="truncate text-[13px] font-medium">{v.name}</p><Meta items={[v.specialty, v.hub]} /></div>
                <div className="shrink-0 text-right"><p className="text-[13px] font-medium tabular">{formatINR(v.totalSpend)}</p><p className="text-xs text-fg-subtle">{v.activePOs} POs</p></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Upcoming productions" description="Live feed · collected ratio from settled customer invoices"
          action={<Link to="/calendar" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Calendar <ArrowUpRight className="size-3" /></Link>} />
        <div className="mt-3"><DataTable rows={m.upcoming} columns={feedColumns} rowKey={(e) => e.code} minWidth={1080} /></div>
      </Card>

      <Card>
        <CardHeader title="Job orders · operational health" description={`${data.jobs.length} job orders across all productions`}
          action={<Link to="/jobs" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Job orders <ArrowUpRight className="size-3" /></Link>} />
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
          {m.jobCounts.map(({ stage, count }) => (
            <div key={stage} className="rounded-lg border border-line p-3">
              <Status tone={jobTone[stage]}>{stage}</Status>
              <p className={`mt-2 text-2xl font-semibold tabular ${stage === 'Overdue' && count > 0 ? 'text-danger' : ''}`}>{count}</p>
            </div>
          ))}
        </div>
        {m.alerts.length > 0 && (
          <div className="flex flex-col gap-2 px-4 pb-4">
            {m.alerts.map((j) => (
              <Callout key={j.no} tone="danger" icon={AlertTriangle}
                title={<><span className="mr-1.5 font-semibold uppercase tracking-wide">{j.stage === 'Overdue' ? 'Overdue' : 'Past due'}</span><span className="font-mono">{j.no}</span> · {j.title}</>}
                action={<Button size="sm" onClick={() => openJob(j.no)}>Open order</Button>}>
                {data.events.find((e) => e.code === j.eventCode)?.title} · due {formatDate(j.due)} · {daysBetween(j.due, TODAY)} days late · {j.executive}
              </Callout>
            ))}
          </div>
        )}
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-fg-subtle"><Wallet className="size-3.5" />All figures in Indian Rupees with en-IN grouping.</p>
    </>
  );
}
