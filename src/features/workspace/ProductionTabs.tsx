import { Check, CheckCircle2, Circle, Lock, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Callout } from '@/components/ui/Feedback';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { Meta } from '@/components/ui/Status';
import { Segmented } from '@/components/ui/Tabs';
import { GatedButton } from '@/components/shared/Gate';
import { ASSIGNABLE_EXECUTIVES } from '@/domain/constants';
import { wrapUpChecklist, type Phase } from '@/domain/readiness';
import type { BookingKind, BookingStatus, ProductionEvent } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { cn } from '@/lib/cn';
import { daysBetween, formatDate, formatShortDate, formatStamp, TODAY } from '@/lib/dates';
import { useAppStore } from '@/store/useAppStore';

const PEOPLE = ['Senthil Kumar', 'Hariprasad Nair', ...ASSIGNABLE_EXECUTIVES];
const BOOKING_STATUSES: BookingStatus[] = ['Not started', 'In progress', 'Confirmed'];

export function VendorsTab({ event }: { event: ProductionEvent }) {
  const bookings = useAppStore((s) => s.data.bookings).filter((b) => b.eventCode === event.code);
  const vendors = useAppStore((s) => s.data.vendors);
  const setStatus = useAppStore((s) => s.setBookingStatus);
  const add = useAppStore((s) => s.addBooking);
  const [kind, setKind] = useState<BookingKind>('Vendor');
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [owner, setOwner] = useState(event.lead);
  const [due, setDue] = useState(event.start);
  const [error, setError] = useState('');

  const submit = () => {
    if (!name.trim()) return setError(kind === 'Vendor' ? 'Pick or type the vendor' : 'Name the permit');
    if (!due) return setError('Set a due date');
    if (notify(add({ eventCode: event.code, kind, name: name.trim(), detail: detail.trim() || '—', owner, due, status: 'Not started' }))) {
      setName(''); setDetail(''); setError('');
    }
  };

  const groups: BookingKind[] = ['Vendor', 'Permit'];
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => {
        const list = bookings.filter((b) => b.kind === g).sort((a, b) => a.due.localeCompare(b.due));
        return (
          <Card key={g}>
            <CardHeader title={g === 'Vendor' ? 'Vendor bookings' : 'Permits & licences'} description={`${list.filter((b) => b.status === 'Confirmed').length} of ${list.length} confirmed`} />
            <ul className="mt-3 divide-y divide-line/70 border-t border-line">
              {list.map((b) => {
                const pastDue = b.status !== 'Confirmed' && b.due < TODAY;
                return (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    {b.status === 'Confirmed' ? <CheckCircle2 aria-hidden className="size-4 text-success" /> : <Circle aria-hidden className={cn('size-4', pastDue ? 'text-danger' : 'text-warning')} />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">{b.name}</p>
                      <Meta items={[b.detail, b.owner, <span key="d" className={cn(pastDue && 'font-medium text-danger')}>{pastDue ? `${daysBetween(b.due, TODAY)} days past due` : `due ${formatShortDate(b.due)}`}</span>]} />
                    </div>
                    <Segmented label={`Status of ${b.name}`} value={b.status} onChange={(s) => notify(setStatus(b.id, s))} options={BOOKING_STATUSES.map((s) => ({ value: s, label: s }))} />
                  </li>
                );
              })}
              {list.length === 0 && <li className="px-4 py-4 text-xs text-fg-subtle">{g === 'Vendor' ? 'No vendors booked for this event yet.' : 'No permits tracked yet. Most venues need police, fire and noise permissions.'}</li>}
            </ul>
          </Card>
        );
      })}
      <Card className="p-4">
        <p className="text-sm font-semibold">Add a vendor or permit</p>
        <form className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[150px_minmax(0,1.3fr)_minmax(0,1fr)_170px_150px_auto]" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Select aria-label="Type" value={kind} options={['Vendor', 'Permit']} onChange={(e) => setKind(e.target.value as BookingKind)} />
          <Input aria-label={kind === 'Vendor' ? 'Vendor' : 'Permit name'} list={kind === 'Vendor' ? 'vendor-names' : undefined} placeholder={kind === 'Vendor' ? 'Vendor, e.g. Deccan Heavy Logistics' : 'Permit, e.g. Fire NOC'} value={name} onChange={(e) => setName(e.target.value)} />
          <datalist id="vendor-names">{vendors.map((v) => <option key={v.id} value={v.name} />)}</datalist>
          <Input aria-label="Details" placeholder="What for" value={detail} onChange={(e) => setDetail(e.target.value)} />
          <Select aria-label="Owner" value={owner} options={[...new Set([event.lead, ...PEOPLE])]} onChange={(e) => setOwner(e.target.value)} />
          <Input aria-label="Due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <Button type="submit" variant="primary"><Plus />Add</Button>
        </form>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </Card>
    </div>
  );
}

export function RunOfShowTab({ event }: { event: ProductionEvent }) {
  const items = useAppStore((s) => s.data.runOfShow).filter((r) => r.eventCode === event.code);
  const toggle = useAppStore((s) => s.toggleRunItem);
  const add = useAppStore((s) => s.addRunItem);
  const [date, setDate] = useState(event.start);
  const [time, setTime] = useState('09:00');
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState(event.lead);
  const days = useMemo(() => [...new Set(items.map((i) => i.date))].sort(), [items]);

  return (
    <div className="flex flex-col gap-4">
      {days.length === 0 && <Callout tone="info" icon={Plus} title="No run of show yet">Add the timed cues for each show day. They appear in Show day mode for the crew.</Callout>}
      {days.map((d) => {
        const list = items.filter((i) => i.date === d).sort((a, b) => a.time.localeCompare(b.time));
        return (
          <Card key={d}>
            <CardHeader title={formatDate(d)} description={`${list.filter((i) => i.done).length} of ${list.length} done${d === TODAY ? ' · today' : ''}`} />
            <ul className="mt-3 divide-y divide-line/70 border-t border-line">
              {list.map((i) => (
                <li key={i.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 hover:bg-subtle">
                    <input type="checkbox" className="peer sr-only" checked={i.done} onChange={() => notify(toggle(i.id))} />
                    <span aria-hidden className={cn('grid size-4 shrink-0 place-items-center rounded border peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50', i.done ? 'border-success bg-success text-white dark:text-canvas' : 'border-line-strong')}>{i.done && <Check className="size-3" strokeWidth={3} />}</span>
                    <span className="w-12 font-mono text-xs text-fg-muted">{i.time}</span>
                    <span className={cn('flex-1 text-[13px]', i.done && 'text-fg-subtle line-through')}>{i.title}</span>
                    <span className="hidden text-xs text-fg-subtle sm:inline">{i.owner}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
      <Card className="p-4">
        <p className="text-sm font-semibold">Add a cue</p>
        <form className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[160px_110px_minmax(0,1fr)_180px_auto]" onSubmit={(e) => { e.preventDefault(); if (title.trim() && notify(add({ eventCode: event.code, date, time, title: title.trim(), owner }))) setTitle(''); }}>
          <Input aria-label="Date" type="date" value={date} min={event.start} onChange={(e) => setDate(e.target.value)} />
          <Input aria-label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Input aria-label="Cue" placeholder="e.g. Chief guest arrival · lamp lighting" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select aria-label="Owner" value={owner} options={[...new Set([event.lead, ...PEOPLE])]} onChange={(e) => setOwner(e.target.value)} />
          <Button type="submit" variant="primary" disabled={!title.trim()}><Plus />Add</Button>
        </form>
      </Card>
    </div>
  );
}

export function WrapUpTab({ event, phase }: { event: ProductionEvent; phase: Phase }) {
  const data = useAppStore((s) => s.data);
  const save = useAppStore((s) => s.saveFeedback);
  const close = useAppStore((s) => s.closeEvent);
  const [feedback, setFeedback] = useState(event.feedback ?? '');
  const items = wrapUpChecklist(data, event);
  const done = items.filter((i) => i.done).length;
  const allDone = done === items.length;
  const early = phase === 'Preparing' || phase === 'Load-in' || phase === 'Live';

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader title={`Close-out checklist · ${done} of ${items.length}`} description={early ? 'This fills in as the show finishes. Most items tick themselves from job orders, invoices and bills.' : 'Everything must be done before the event can be closed.'} />
        <ul className="mt-3 divide-y divide-line/70 border-t border-line">
          {items.map((i) => (
            <li key={i.key} className="flex items-start gap-3 px-4 py-3">
              {i.done ? <CheckCircle2 aria-label="Done" className="mt-0.5 size-4 text-success" /> : <Circle aria-label="Not done" className="mt-0.5 size-4 text-fg-subtle" />}
              <div><p className={cn('text-[13px] font-medium', i.done && 'text-fg-muted')}>{i.label}</p><p className="text-xs text-fg-subtle">{i.detail}</p></div>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="flex flex-col gap-3 p-4">
        <label htmlFor="feedback" className="text-sm font-semibold">Client feedback</label>
        <Textarea id="feedback" placeholder={`What did ${event.client} say about the event? Anything to repeat or avoid next time?`} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        <Button disabled={!feedback.trim() || feedback === (event.feedback ?? '')} onClick={() => notify(save(event.code, feedback.trim()))}>Save feedback</Button>
        <div className="border-t border-line pt-3">
          {event.closedAt
            ? <p className="text-xs text-fg-muted">Closed {formatStamp(event.closedAt)}.</p>
            : <GatedButton permission="event.setStatus" allowed={allDone} variant="primary" className="w-full" onClick={() => notify(close(event.code))}>{allDone ? 'Close event' : <><Lock />Close event</>}</GatedButton>}
          {!allDone && !event.closedAt && <p className="mt-2 text-xs text-fg-subtle">{items.length - done} items left before this event can be closed.</p>}
        </div>
      </Card>
    </div>
  );
}
