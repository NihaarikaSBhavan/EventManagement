import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input, Select } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Tabs';
import { SectionTitle } from '@/components/shared/Detail';
import { EventPicker } from '@/components/shared/Pickers';
import { GST_RATES, MILESTONES } from '@/domain/constants';
import { invoiceTotals } from '@/domain/selectors';
import type { BillingMilestone, GstRate } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { addDays, TODAY } from '@/lib/dates';
import { formatINR, parseAmount } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

type Line = { key: number; description: string; qty: string; rate: string };
let lineKey = 0;
const newLine = (): Line => ({ key: ++lineKey, description: '', qty: '1', rate: '' });

export function InvoiceDialog({ track: initialTrack, onClose, defaultEvent }: { track: null | 'AR' | 'AP'; onClose: (created?: 'AR' | 'AP') => void; defaultEvent?: string }) {
  const events = useAppStore((s) => s.data.events);
  const vendors = useAppStore((s) => s.data.vendors);
  const createInvoice = useAppStore((s) => s.createInvoice);
  const createBill = useAppStore((s) => s.createBill);
  const [track, setTrack] = useState<'AR' | 'AP'>('AR');
  const [eventCode, setEventCode] = useState('');
  const [vendor, setVendor] = useState('');
  const [milestone, setMilestone] = useState<BillingMilestone>('Retainer');
  const [gst, setGst] = useState<GstRate>(18);
  const [issuedOn, setIssuedOn] = useState(TODAY);
  const [dueOn, setDueOn] = useState(addDays(TODAY, 15));
  const [lines, setLines] = useState<Line[]>([newLine()]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialTrack) return;
    setTrack(initialTrack);
    setEventCode(defaultEvent ?? events.find((e) => e.status !== 'Completed')?.code ?? '');
    setVendor(vendors[0]?.name ?? '');
    setMilestone('Retainer'); setGst(18); setIssuedOn(TODAY); setDueOn(addDays(TODAY, 15)); setLines([newLine()]); setError('');
  }, [initialTrack, events, vendors, defaultEvent]);

  const parsed = lines.map((l) => ({ description: l.description.trim(), qty: parseAmount(l.qty) || 0, rate: parseAmount(l.rate) || 0 }));
  const totals = invoiceTotals(parsed, gst);
  const update = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const submit = () => {
    const valid = parsed.filter((l) => l.description && l.qty > 0 && l.rate > 0);
    if (!valid.length) return setError('Add at least one line item with a description, quantity and rate.');
    if (!eventCode) return setError('Pick the event this belongs to.');
    if (!dueOn) return setError('Set a due date.');
    const result = track === 'AR'
      ? createInvoice({ eventCode, milestone, lines: valid, gst, issuedOn, dueOn })
      : createBill({ vendor, eventCode, lines: valid, gst, dueOn });
    if (notify(result)) onClose(track);
  };

  return (
    <Dialog
      open={initialTrack !== null}
      onOpenChange={(o) => !o && onClose()}
      size="xl"
      title="Create invoice"
      description="Line items, quantities and GST"
      footer={<>
        {error && <p className="mr-auto text-xs text-danger">{error}</p>}
        <Button onClick={() => onClose()}>Cancel</Button>
        <Button variant="primary" onClick={submit}>{track === 'AR' ? 'Raise invoice' : 'Log bill'} · {formatINR(totals.total)}</Button>
      </>}
    >
      <div className="flex flex-col gap-6">
        <Segmented label="Invoice track" value={track} onChange={setTrack} options={[{ value: 'AR', label: 'Customer invoice · receivable' }, { value: 'AP', label: 'Vendor / internal bill · payable' }]} />

        <section>
          <SectionTitle>Parent event</SectionTitle>
          <EventPicker name="invoice-event" value={eventCode} onChange={setEventCode} />
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {track === 'AR'
            ? <Field label="Billing milestone">{(p) => <Select {...p} options={MILESTONES} value={milestone} onChange={(e) => setMilestone(e.target.value as BillingMilestone)} />}</Field>
            : <Field label="Vendor">{(p) => <Select {...p} options={[...vendors.map((v) => v.name), 'Internal · Operations']} value={vendor} onChange={(e) => setVendor(e.target.value)} />}</Field>}
          <Field label="GST rate">{(p) => <Select {...p} options={GST_RATES.map((r) => ({ value: String(r), label: r === 0 ? '0% (exempt)' : `${r}%` }))} value={String(gst)} onChange={(e) => setGst(Number(e.target.value) as GstRate)} />}</Field>
          {track === 'AR' && <Field label="Issue date">{(p) => <Input {...p} type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />}</Field>}
          <Field label="Due date">{(p) => <Input {...p} type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />}</Field>
        </div>

        <section>
          <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => setLines((l) => [...l, newLine()])}><Plus />Add line</Button>}>Line items</SectionTitle>
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead className="bg-subtle text-2xs uppercase tracking-wider text-fg-subtle">
                <tr><th className="px-3 py-2 text-left font-medium">Description</th><th className="w-20 px-2 py-2 text-left font-medium">Qty</th><th className="w-32 px-2 py-2 text-left font-medium">Rate (₹)</th><th className="w-32 px-3 py-2 text-right font-medium">Amount</th><th className="w-10" /></tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {lines.map((l, i) => (
                  <tr key={l.key}>
                    <td className="px-3 py-1.5"><Input aria-label={`Line ${i + 1} description`} placeholder="e.g. Stage fabrication" value={l.description} onChange={(e) => update(l.key, { description: e.target.value })} /></td>
                    <td className="px-2 py-1.5"><Input aria-label={`Line ${i + 1} quantity`} inputMode="numeric" className="text-right tabular" value={l.qty} onChange={(e) => update(l.key, { qty: e.target.value })} /></td>
                    <td className="px-2 py-1.5"><Input aria-label={`Line ${i + 1} rate`} inputMode="numeric" className="text-right tabular" value={l.rate} onChange={(e) => update(l.key, { rate: e.target.value })} /></td>
                    <td className="px-3 py-1.5 text-right font-medium tabular">{formatINR(parsed[i].qty * parsed[i].rate)}</td>
                    <td className="pr-2"><Button size="icon-sm" variant="ghost" aria-label={`Remove line ${i + 1}`} disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Trash2 /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="ml-auto mt-3 flex w-full max-w-xs flex-col gap-1.5 text-[13px]">
            <div className="flex justify-between"><dt className="text-fg-muted">Subtotal</dt><dd className="tabular">{formatINR(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-fg-muted">GST @ {gst}%</dt><dd className="tabular">{formatINR(totals.gst)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-sm font-semibold"><dt>Total</dt><dd className="tabular">{formatINR(totals.total)}</dd></div>
          </dl>
        </section>
      </div>
    </Dialog>
  );
}
