import { ClipboardList, Plus, Receipt, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Select } from '@/components/ui/Field';
import { Progress } from '@/components/ui/Progress';
import { Meta, Priority, Status } from '@/components/ui/Status';
import { GatedButton } from '@/components/shared/Gate';
import { DEPOT_SHORT } from '@/domain/constants';
import { gearShortfall, requestedGear } from '@/domain/readiness';
import { documentTotal, isLate, jobProgress } from '@/domain/selectors';
import { invoiceTone, jobPriorityTone, jobTone } from '@/domain/tones';
import type { InvoiceStatus, ProductionEvent } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { useCan } from '@/hooks/usePermission';
import { cn } from '@/lib/cn';
import { formatDate, formatShortDate, TODAY } from '@/lib/dates';
import { formatINR, formatNumber, percent } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { InvoiceDialog } from '../finance/InvoiceDialog';
import { JobFormDialog } from '../jobs/JobFormDialog';

export function JobsTab({ event }: { event: ProductionEvent }) {
  const jobs = useAppStore((s) => s.data.jobs).filter((j) => j.eventCode === event.code);
  const { openJob } = useEntityLinks();
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader title="Job orders" description="Tick deliverables inside each order. 100% sends it to a team lead for QC."
        action={<GatedButton permission="job.create" size="sm" variant="primary" onClick={() => setOpen(true)}><Plus />New job order</GatedButton>} />
      {jobs.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No job orders yet" description="Break the build into job orders so each crew knows what to deliver and when." />
      ) : (
        <ul className="mt-3 divide-y divide-line/70 border-t border-line">
          {jobs.map((j) => {
            const p = jobProgress(j);
            return (
              <li key={j.no}>
                <button type="button" onClick={() => openJob(j.no)} className="grid w-full grid-cols-1 gap-3 px-4 py-3 text-left hover:bg-subtle md:grid-cols-[minmax(0,1fr)_150px_200px_90px] md:items-center">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium">{j.title}</p>
                    <Meta items={[<span key="n" className="font-mono">{j.no}</span>, j.executive, `TL ${j.teamLead}`]} />
                  </div>
                  <div className="flex items-center gap-3"><Status tone={jobTone[j.stage]}>{j.stage}</Status><Priority tone={jobPriorityTone[j.priority]}>{j.priority}</Priority></div>
                  <div className="flex items-center gap-2"><Progress value={p.percent} tone={p.percent === 100 ? 'success' : 'info'} className="flex-1" label={`${p.percent}% done`} /><span className="w-16 text-right font-mono text-2xs">{p.done}/{p.total} · {p.percent}%</span></div>
                  <span className={cn('text-xs tabular md:text-right', isLate(j, TODAY) ? 'font-medium text-danger' : 'text-fg-muted')}>Due {formatShortDate(j.due)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <JobFormDialog open={open} onOpenChange={setOpen} defaultEvent={event.code} />
    </Card>
  );
}

export function GearTab({ event }: { event: ProductionEvent }) {
  const { jobs, inventory } = useAppStore((s) => s.data);
  const topUp = useAppStore((s) => s.topUpGear);
  const { openJob } = useEntityLinks();
  const eventJobs = jobs.filter((j) => j.eventCode === event.code && j.stage !== 'Completed');
  const item = (id: string) => inventory.find((i) => i.id === id);
  const rows = eventJobs.flatMap((j) => requestedGear(j).map((r) => ({ job: j, itemId: r.itemId, requested: r.qty, reserved: j.gear.find((g) => g.itemId === r.itemId)?.qty ?? 0 })));
  const perDay = rows.reduce((s, r) => s + r.reserved * (item(r.itemId)?.dailyRate ?? 0), 0);

  return (
    <Card>
      <CardHeader title="Gear for this event" description={rows.length ? `${formatNumber(rows.reduce((s, r) => s + r.reserved, 0))} units reserved · ${formatINR(perDay)}/day rental value` : 'Gear is reserved through job orders'} />
      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No gear reserved yet" description="Add gear when you create a job order, or in a converted lead's dossier." />
      ) : (
        <div className="mt-3 overflow-x-auto border-t border-line">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="bg-subtle text-2xs uppercase tracking-wider text-fg-subtle">
              <tr><th className="px-4 py-2 text-left font-medium">Item</th><th className="px-3 py-2 text-left font-medium">Depot</th><th className="px-3 py-2 text-left font-medium">Job order</th><th className="px-3 py-2 text-right font-medium">Asked</th><th className="px-3 py-2 text-right font-medium">Reserved</th><th className="px-4 py-2 text-right font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {rows.map((r) => {
                const short = r.requested - r.reserved;
                const it = item(r.itemId);
                return (
                  <tr key={`${r.job.no}-${r.itemId}`}>
                    <td className="px-4 py-2.5 font-medium">{it?.name ?? r.itemId}</td>
                    <td className="px-3 py-2.5 text-fg-muted">{it ? DEPOT_SHORT[it.depot] : '—'}</td>
                    <td className="px-3 py-2.5"><button type="button" onClick={() => openJob(r.job.no)} className="font-mono text-xs text-primary hover:underline">{r.job.no}</button></td>
                    <td className="px-3 py-2.5 text-right tabular">{formatNumber(r.requested)}</td>
                    <td className="px-3 py-2.5 text-right font-medium tabular">{formatNumber(r.reserved)}</td>
                    <td className="px-4 py-2.5 text-right">{short > 0 ? <span className="text-xs font-semibold text-danger">Short {formatNumber(short)}</span> : <span className="text-xs font-medium text-success">Reserved</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {eventJobs.some((j) => gearShortfall(j).length) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-danger-soft/50 px-4 py-3">
          <p className="text-xs text-fg-muted">Stock was short when this was booked. Retry once a depot stocks in or another order frees gear.</p>
          <div className="flex flex-wrap gap-2">
            {eventJobs.filter((j) => gearShortfall(j).length).map((j) => (
              <GatedButton key={j.no} permission="inventory.stockIn" size="sm" variant="primary" onClick={() => notify(topUp(j.no))}><RefreshCw />Retry {j.no.slice(-6)}</GatedButton>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function MoneyTab({ event }: { event: ProductionEvent }) {
  const { invoices, bills } = useAppStore((s) => s.data);
  const setStatus = useAppStore((s) => s.setInvoiceStatus);
  const canEdit = useCan('invoice.setStatus');
  const [open, setOpen] = useState(false);
  const own = invoices.filter((i) => i.eventCode === event.code);
  const collected = own.filter((i) => i.status === 'Paid').reduce((s, i) => s + documentTotal(i), 0);
  const invoiced = own.reduce((s, i) => s + documentTotal(i), 0);
  const ownBills = bills.filter((b) => b.eventCode === event.code);

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader title="Client invoices" description={`${event.client} · retainer and fabrication advance should land before load-in`}
          action={<GatedButton permission="invoice.create" size="sm" variant="primary" onClick={() => setOpen(true)}><Plus />Raise invoice</GatedButton>} />
        {own.length === 0 ? <EmptyState icon={Receipt} title="Nothing invoiced yet" description="Start with the retainer so the client is committed." /> : (
          <ul className="mt-3 divide-y divide-line/70 border-t border-line">
            {own.map((i) => (
              <li key={i.no} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{i.milestone} · <span className="tabular">{formatINR(documentTotal(i))}</span></p>
                  <Meta items={[<span key="n" className="font-mono">{i.no}</span>, `due ${formatDate(i.dueOn)}`, i.settledAt ? `paid ${formatShortDate(i.settledAt)}` : null]} />
                </div>
                {canEdit
                  ? <Select aria-label={`Status of ${i.no}`} className="w-32" value={i.status} options={['Paid', 'Pending', 'Overdue']} onChange={(e) => notify(setStatus(i.no, e.target.value as InvoiceStatus))} />
                  : <Status tone={invoiceTone[i.status]}>{i.status}</Status>}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="flex flex-col gap-4">
        <Card className="p-4">
          <p className="text-xs text-fg-muted">Collected against budget</p>
          <p className="mt-1 text-xl font-semibold tabular">{formatINR(collected)}</p>
          <Progress value={percent(collected, event.budget)} tone="success" className="mt-3 h-2" label="Collected against budget" />
          <p className="mt-2 text-xs text-fg-subtle">{percent(collected, event.budget)}% of {formatINR(event.budget)} · {formatINR(invoiced - collected)} invoiced and still due</p>
        </Card>
        <Card>
          <CardHeader title="Vendor bills" description="What this event owes subcontractors" />
          <ul className="mt-3 divide-y divide-line/70 border-t border-line">
            {ownBills.map((b) => (
              <li key={b.no} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                <span className="min-w-0 truncate">{b.vendor}</span>
                <span className="flex shrink-0 items-center gap-2 tabular">{formatINR(documentTotal(b))}<Status tone={invoiceTone[b.status]}>{b.status}</Status></span>
              </li>
            ))}
            {ownBills.length === 0 && <li className="px-4 py-4 text-xs text-fg-subtle">No vendor bills logged.</li>}
          </ul>
        </Card>
      </div>
      <InvoiceDialog track={open ? 'AR' : null} defaultEvent={event.code} onClose={() => setOpen(false)} />
    </div>
  );
}
