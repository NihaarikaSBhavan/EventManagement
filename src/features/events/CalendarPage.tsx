import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Meta, Status } from '@/components/ui/Status';
import { Tooltip } from '@/components/ui/Tooltip';
import { GatedButton } from '@/components/shared/Gate';
import { PageHeader } from '@/components/shared/PageHeader';
import { EVENT_STATUSES } from '@/domain/constants';
import { eventChip, eventTone } from '@/domain/tones';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { useCan } from '@/hooks/usePermission';
import { cn } from '@/lib/cn';
import { formatDate, formatRange, monthGrid, monthLabel, shiftMonth, TODAY } from '@/lib/dates';
import { formatINR, formatNumber } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { ScheduleEventDialog } from './ScheduleEventDialog';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarPage() {
  const events = useAppStore((s) => s.data.events);
  const canSchedule = useCan('event.schedule');
  const { openEvent } = useEntityLinks();
  const [params, setParams] = useSearchParams();
  const month = params.get('month') ?? TODAY.slice(0, 7);
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);

  const setMonth = (m: string) => setParams((p) => { const n = new URLSearchParams(p); n.set('month', m); return n; }, { replace: true });
  const cells = monthGrid(month);
  const monthStart = `${month}-01`;
  const monthEnd = cells[cells.length - 1];
  const inMonth = events.filter((e) => e.start.slice(0, 7) <= month && e.end.slice(0, 7) >= month).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <>
      <PageHeader
        title="Master production calendar"
        description="Every live, pre-production and scheduled production across South India."
        actions={<GatedButton permission="event.schedule" variant="primary" onClick={() => setScheduleDate(TODAY)}><CalendarPlus />Schedule event</GatedButton>}
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft /></Button>
            <h2 className="min-w-[150px] text-center text-sm font-semibold">{monthLabel(month)}</h2>
            <Button size="icon" variant="ghost" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight /></Button>
            <Button size="sm" className="ml-2" onClick={() => setMonth(TODAY.slice(0, 7))}>Today</Button>
          </div>
          <ul className="flex flex-wrap gap-4" aria-label="Legend">
            {EVENT_STATUSES.map((s) => <li key={s}><Status tone={eventTone[s]}>{s}</Status></li>)}
          </ul>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-7 border-b border-line bg-subtle">
              {WEEKDAYS.map((d) => <div key={d} className="px-3 py-2 text-2xs font-medium uppercase tracking-wider text-fg-subtle">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((iso, i) => {
                const outside = iso.slice(0, 7) !== month;
                const isToday = iso === TODAY;
                const dayEvents = events.filter((e) => e.start <= iso && e.end >= iso);
                const weekday = i % 7;
                return (
                  <div key={iso} className={cn('group min-h-[118px] border-b border-r border-line/70 p-1.5 [&:nth-child(7n)]:border-r-0', outside && 'bg-subtle/60')}>
                    <div className="mb-1 flex items-center justify-between px-1">
                      <span className={cn('grid size-6 place-items-center rounded-md text-xs font-medium tabular', isToday ? 'bg-primary text-primary-fg' : outside ? 'text-fg-subtle' : 'text-fg')}>{Number(iso.slice(8))}</span>
                      {canSchedule && !outside && (
                        <Tooltip content={`Schedule on ${formatDate(iso)}`}>
                          <button type="button" aria-label={`Schedule an event on ${formatDate(iso)}`} onClick={() => setScheduleDate(iso)}
                            className="grid size-6 place-items-center rounded-md text-fg-subtle opacity-0 hover:bg-muted hover:text-fg focus-visible:opacity-100 group-hover:opacity-100">
                            <CalendarPlus className="size-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {dayEvents.map((e) => {
                        const isStart = e.start === iso || weekday === 0;
                        return (
                          <button key={e.code} type="button" onClick={() => openEvent(e.code)} title={`${e.title} · ${e.client} · ${e.status}`}
                            className={cn('truncate rounded px-1.5 py-1 text-left text-2xs font-medium transition', eventChip[e.status], !isStart && 'opacity-80')}>
                            {isStart ? e.title : `↳ ${e.title}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title={`Productions in ${monthLabel(month)}`} description={`${inMonth.length} productions overlap ${formatDate(monthStart)} – ${formatDate(monthEnd)}`} />
        <div className="mt-3">
          <DataTable
            rows={inMonth}
            rowKey={(e) => e.code}
            onRowClick={(e) => openEvent(e.code)}
            minWidth={980}
            empty={<p className="px-4 pb-6 text-xs text-fg-subtle">No productions this month.</p>}
            columns={[
              { id: 'title', header: 'Production', sortValue: (e) => e.title, cell: (e) => <div><p className="font-medium">{e.title}</p><Meta items={[<span key="c" className="font-mono">{e.code}</span>, e.client]} /></div> },
              { id: 'venue', header: 'Venue', cell: (e) => <span className="text-fg-muted">{e.venue}, {e.city}</span> },
              { id: 'dates', header: 'Run of show', sortValue: (e) => e.start, cell: (e) => formatRange(e.start, e.end) },
              { id: 'cap', header: 'Delegates', align: 'right', sortValue: (e) => e.capacity, cell: (e) => <span className="tabular">{e.capacity ? formatNumber(e.capacity) : 'TBC'}</span> },
              { id: 'budget', header: 'Budget', align: 'right', sortValue: (e) => e.budget, cell: (e) => <span className="font-medium tabular">{formatINR(e.budget)}</span> },
              { id: 'status', header: 'Status', sortValue: (e) => e.status, cell: (e) => <Status tone={eventTone[e.status]}>{e.status}</Status> },
            ]}
          />
        </div>
      </Card>

      <ScheduleEventDialog date={scheduleDate} onClose={(created) => { setScheduleDate(null); if (created) setMonth(created.slice(0, 7)); }} />
    </>
  );
}
