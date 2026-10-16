import { useMemo } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Progress } from '@/components/ui/Progress';
import { Status } from '@/components/ui/Status';
import { DetailGrid, SectionTitle } from '@/components/shared/Detail';
import { EVENT_STATUSES } from '@/domain/constants';
import { documentTotal, jobProgress, receivables } from '@/domain/selectors';
import { eventTone, invoiceTone, jobTone } from '@/domain/tones';
import type { EventStatus } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { useCan } from '@/hooks/usePermission';
import { daysBetween, formatRange, TODAY } from '@/lib/dates';
import { formatINR, formatNumber, percent } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

export function EventDetailDialog() {
  const { eventCode, openJob, close } = useEntityLinks();
  const data = useAppStore((s) => s.data);
  const setStatus = useAppStore((s) => s.setEventStatus);
  const canEdit = useCan('event.setStatus');
  const event = data.events.find((e) => e.code === eventCode);

  const derived = useMemo(() => {
    if (!event) return null;
    const collected = receivables(data.invoices, TODAY).collectedByEvent[event.code] ?? 0;
    return {
      collected,
      invoices: data.invoices.filter((i) => i.eventCode === event.code),
      jobs: data.jobs.filter((j) => j.eventCode === event.code),
    };
  }, [event, data]);

  if (!event || !derived) return null;
  const pct = percent(derived.collected, event.budget);
  const days = daysBetween(event.start, event.end) + 1;

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && close()}
      title={event.title}
      description={<span className="font-mono">{event.code}</span>}
      size="xl"
      footer={<Button onClick={close}>Close</Button>}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Status tone={eventTone[event.status]}>{event.status}</Status>
          {canEdit ? (
            <label className="flex items-center gap-2 text-xs text-fg-subtle">
              Production status
              <Select className="w-44" value={event.status} options={EVENT_STATUSES} onChange={(e) => notify(setStatus(event.code, e.target.value as EventStatus))} />
            </label>
          ) : (
            <span className="text-xs text-fg-subtle">Status changes need MANAGER or above</span>
          )}
        </div>

        <DetailGrid
          items={[
            { label: 'Client organization', value: <span className="font-medium">{event.client}</span> },
            { label: 'Venue', value: `${event.venue}, ${event.city}` },
            { label: 'Delegate capacity', value: event.capacity ? `${formatNumber(event.capacity)} delegates` : 'To be confirmed' },
            { label: 'Executive lead', value: event.lead },
            { label: 'Run of show', value: `${formatRange(event.start, event.end)} · ${days}-day run` },
            { label: 'Format', value: event.format },
            { label: 'Venue specs', value: event.venueSpec, wide: true },
          ]}
        />

        <section className="rounded-lg border border-line p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <SectionTitle>Budget vs collection</SectionTitle>
            <span className="text-[13px] tabular"><span className="font-semibold">{formatINR(derived.collected)}</span> <span className="text-fg-subtle">of {formatINR(event.budget)} · {pct}%</span></span>
          </div>
          <Progress value={pct} tone="success" label="Collected against budget" className="h-2" />
          <ul className="mt-4 divide-y divide-line/70">
            {derived.invoices.map((i) => (
              <li key={i.no} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                <span className="min-w-0 truncate"><span className="font-mono text-xs text-fg-subtle">{i.no}</span> · {i.milestone}</span>
                <span className="flex shrink-0 items-center gap-3 tabular">{formatINR(documentTotal(i))}<Status tone={invoiceTone[i.status]}>{i.status}</Status></span>
              </li>
            ))}
            {derived.invoices.length === 0 && <li className="py-2 text-xs text-fg-subtle">No customer invoices raised yet.</li>}
          </ul>
        </section>

        <section>
          <SectionTitle>Job orders</SectionTitle>
          <ul className="divide-y divide-line/70 rounded-lg border border-line">
            {derived.jobs.map((j) => (
              <li key={j.no}>
                <button type="button" onClick={() => openJob(j.no)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-[13px] hover:bg-subtle">
                  <span className="min-w-0 truncate"><span className="font-mono text-xs text-fg-subtle">{j.no}</span> · {j.title}</span>
                  <span className="flex shrink-0 items-center gap-3"><Status tone={jobTone[j.stage]}>{j.stage}</Status><span className="w-9 text-right font-mono text-xs">{jobProgress(j).percent}%</span></span>
                </button>
              </li>
            ))}
            {derived.jobs.length === 0 && <li className="px-3 py-3 text-xs text-fg-subtle">No job orders yet.</li>}
          </ul>
        </section>
      </div>
    </Dialog>
  );
}
