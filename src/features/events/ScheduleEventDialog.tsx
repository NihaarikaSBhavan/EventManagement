import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input, Select } from '@/components/ui/Field';
import { ASSIGNABLE_EXECUTIVES, HUBS } from '@/domain/constants';
import type { City, EventStatus } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { formatINR, parseAmount } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

const blank = (date: string) => ({ title: '', client: '', venue: '', city: 'Chennai' as City, status: 'Planning' as EventStatus, start: date, end: date, capacity: '', budget: '', lead: 'Gautham Vasudevan', spec: '', format: 'Corporate summit' });

export function ScheduleEventDialog({ date, onClose }: { date: string | null; onClose: (createdStart?: string) => void }) {
  const schedule = useAppStore((s) => s.scheduleEvent);
  const [f, setF] = useState(() => blank(date ?? ''));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (date) { setF(blank(date)); setErrors({}); } }, [date]);
  const set = (k: keyof ReturnType<typeof blank>) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const budget = parseAmount(f.budget);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.title.trim()) e.title = 'Required';
    if (!f.client.trim()) e.client = 'Required';
    if (!f.venue.trim()) e.venue = 'Required';
    if (!f.start) e.start = 'Required';
    if (!f.end || f.end < f.start) e.end = 'Must be on or after the start date';
    setErrors(e);
    if (Object.keys(e).length) return;
    const ok = notify(schedule({
      title: f.title.trim(), client: f.client.trim(), venue: f.venue.trim(), city: f.city, venueSpec: f.spec.trim() || 'Specs pending site recce',
      start: f.start, end: f.end, status: f.status, budget: budget || 0, capacity: Math.floor(parseAmount(f.capacity)) || 0, lead: f.lead, format: f.format,
    }));
    if (ok) onClose(f.start);
  };

  return (
    <Dialog open={date !== null} onOpenChange={(o) => !o && onClose()} title="Schedule event" description="Adds a production to the master calendar"
      footer={<><Button onClick={() => onClose()}>Cancel</Button><Button variant="primary" onClick={submit}>Schedule</Button></>}>
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="Event title" error={errors.title} className="sm:col-span-2">{(p) => <Input {...p} autoFocus placeholder="e.g. Coastal Auto Dealers Summit" value={f.title} onChange={set('title')} />}</Field>
        <Field label="Client organization" error={errors.client}>{(p) => <Input {...p} value={f.client} onChange={set('client')} />}</Field>
        <Field label="Venue" error={errors.venue}>{(p) => <Input {...p} placeholder="e.g. Chennai Trade Centre" value={f.venue} onChange={set('venue')} />}</Field>
        <Field label="City">{(p) => <Select {...p} options={HUBS} value={f.city} onChange={set('city')} />}</Field>
        <Field label="Status">{(p) => <Select {...p} options={['Planning', 'Pre-production', 'Live/Active']} value={f.status} onChange={set('status')} />}</Field>
        <Field label="Start date" error={errors.start}>{(p) => <Input {...p} type="date" value={f.start} onChange={set('start')} />}</Field>
        <Field label="End date" error={errors.end}>{(p) => <Input {...p} type="date" value={f.end} min={f.start} onChange={set('end')} />}</Field>
        <Field label="Delegate capacity">{(p) => <Input {...p} inputMode="numeric" value={f.capacity} onChange={set('capacity')} />}</Field>
        <Field label="Budget (₹)" hint={budget > 0 ? formatINR(budget) : 'Contract value'}>{(p) => <Input {...p} inputMode="numeric" className="tabular" value={f.budget} onChange={set('budget')} />}</Field>
        <Field label="Executive lead">{(p) => <Select {...p} options={ASSIGNABLE_EXECUTIVES.slice(0, 3)} value={f.lead} onChange={set('lead')} />}</Field>
        <Field label="Format">{(p) => <Select {...p} options={['Corporate summit', 'Trade exhibition', 'Product launch', 'Luxury brand gala']} value={f.format} onChange={set('format')} />}</Field>
        <Field label="Venue specs" className="sm:col-span-2">{(p) => <Input {...p} placeholder="e.g. Hall 1 · 12,000 sq ft · 8 m rigging height" value={f.spec} onChange={set('spec')} />}</Field>
        <button type="submit" className="hidden" />
      </form>
    </Dialog>
  );
}
