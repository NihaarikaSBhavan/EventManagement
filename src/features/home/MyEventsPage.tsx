import { ArrowRight, CalendarPlus, MapPin, Radio, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Meta } from '@/components/ui/Status';
import { Segmented } from '@/components/ui/Tabs';
import { BlockerList } from '@/components/shared/BlockerList';
import { GatedButton } from '@/components/shared/Gate';
import { LevelIcon, LevelLabel, useActiveReadiness } from '@/components/shared/Readiness';
import { needsAttention, type Readiness } from '@/domain/readiness';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { usePersona } from '@/hooks/usePermission';
import { cn } from '@/lib/cn';
import { formatDate, formatRange, TODAY } from '@/lib/dates';
import { useAppStore } from '@/store/useAppStore';
import { ScheduleEventDialog } from '../events/ScheduleEventDialog';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function MyEventsPage() {
  const persona = usePersona();
  const jobs = useAppStore((s) => s.data.jobs);
  const all = useActiveReadiness();
  const { openEvent } = useEntityLinks();
  const [scope, setScope] = useState<'mine' | 'all'>(persona.role === 'EXECUTIVE' ? 'mine' : 'all');
  const [scheduleOpen, setScheduleOpen] = useState<string | null>(null);

  const isMine = (r: Readiness) => r.event.lead === persona.name || jobs.some((j) => j.eventCode === r.event.code && [j.executive, j.teamLead, j.manager].includes(persona.name));
  const list = scope === 'mine' ? all.filter(isMine) : all;
  const queue = useMemo(() => needsAttention(list).map((b) => ({ ...b, eventTitle: b.event.title })), [list]);
  const [queueScope, setQueueScope] = useState<'all' | 'me'>('all');
  const shownQueue = queueScope === 'me' ? queue.filter((b) => b.owner === persona.name) : queue;

  const live = list.filter((r) => r.phase === 'Live' || r.phase === 'Load-in');
  const blocked = list.filter((r) => r.level === 'blocked').length;
  const ready = list.filter((r) => r.level === 'ready').length;
  const next = list.find((r) => r.phase === 'Preparing');

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-fg-subtle">{formatDate(TODAY)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{greeting()}, {persona.name.replace(/^K\. /, '').split(' ')[0]}</h1>
          <p className="mt-1.5 max-w-2xl text-[13px] text-fg-muted">
            {list.length === 0
              ? 'You have no events in preparation.'
              : <>You have <b className="font-semibold text-fg">{list.length} events</b> on the go. {blocked ? <><b className="font-semibold text-danger">{blocked} {blocked === 1 ? 'needs' : 'need'} you before they're show-ready</b>{ready ? `, ${ready} ready to go` : ''}.</> : ready === list.length ? 'All of them are ready to go.' : `${ready} ready to go.`}{next && <> Next load-in is <b className="font-semibold text-fg">{next.event.title}</b> at {next.event.venue}, {next.countdown.toLowerCase().replace('load-in ', '')}.</>}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Which events" value={scope} onChange={setScope} options={[{ value: 'mine', label: 'My events' }, { value: 'all', label: 'All events' }]} />
          <GatedButton permission="event.schedule" variant="primary" onClick={() => setScheduleOpen(TODAY)}><CalendarPlus />New event</GatedButton>
        </div>
      </header>

      {live.map((r) => (
        <Link key={r.event.code} to="/show-day" className="flex flex-wrap items-center gap-3 rounded-lg border border-success/30 bg-success-soft px-4 py-3 transition hover:brightness-[0.98]">
          <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" /><span className="relative inline-flex size-2.5 rounded-full bg-success" /></span>
          <span className="text-[13px] font-medium text-success">{r.event.title} is {r.phase === 'Live' ? 'live' : 'loading in'} today</span>
          <span className="text-xs text-fg-muted">{r.countdown} · {r.event.venue}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-success"><Radio className="size-3.5" />Open show day <ArrowRight className="size-3.5" /></span>
        </Link>
      ))}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section aria-label="Event readiness" className="flex min-w-0 flex-col gap-3">
          {list.length === 0 && (
            <Card><EmptyState icon={Users} title={scope === 'mine' ? 'No events assigned to you' : 'No active events'} description={scope === 'mine' ? 'Switch to All events, or ask your manager to assign you as lead.' : 'Schedule an event or convert a won lead.'} action={scope === 'mine' ? <Button onClick={() => setScope('all')}>Show all events</Button> : undefined} /></Card>
          )}
          {list.map((r) => (
            <Card key={r.event.code} className="overflow-hidden">
              <button type="button" onClick={() => openEvent(r.event.code)} className="group flex w-full flex-col text-left">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 px-4 pt-4">
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-semibold tracking-tight group-hover:text-primary">{r.event.title}</h2>
                    <Meta className="mt-0.5 block" items={[r.event.client, <span key="v" className="inline-flex items-center gap-1"><MapPin className="size-3" />{r.event.venue}</span>, formatRange(r.event.start, r.event.end)]} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('rounded-md px-2 py-1 text-xs font-semibold tabular', r.phase === 'Live' ? 'bg-success-soft text-success' : r.daysToLoadIn <= 7 ? 'bg-warning-soft text-warning' : 'bg-muted text-fg-muted')}>{r.countdown}</span>
                    <LevelLabel level={r.level} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
                  {r.checks.map((c) => (
                    <div key={c.key} className="flex items-start gap-2.5 bg-surface px-4 py-3">
                      <LevelIcon level={c.level} className="mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-fg">{c.label}</p>
                        <p className="mt-0.5 text-xs leading-4 text-fg-subtle">{c.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </button>
            </Card>
          ))}
        </section>

        <Card className="xl:sticky xl:top-16">
          <CardHeader
            title={`Needs attention · ${shownQueue.length}`}
            description="Most urgent first. Each item opens where it gets fixed."
            action={<Segmented label="Owner" value={queueScope} onChange={setQueueScope} options={[{ value: 'all', label: 'Everyone' }, { value: 'me', label: 'Mine' }]} />}
          />
          <div className="mt-2 max-h-[70vh] overflow-y-auto border-t border-line">
            <BlockerList items={shownQueue} showEvent me={persona.name} empty={queueScope === 'me' ? 'Nothing assigned to you needs attention.' : 'Every event is on track.'} />
          </div>
          <div className="flex flex-wrap gap-3 border-t border-line px-4 py-2.5 text-2xs text-fg-subtle">
            <span className="inline-flex items-center gap-1"><LevelIcon level="blocked" className="size-3" />Blocked — will stop the show</span>
            <span className="inline-flex items-center gap-1"><LevelIcon level="attention" className="size-3" />Needs attention</span>
          </div>
        </Card>
      </div>

      <p className="text-xs text-fg-subtle">
        An event is ready when its job orders are on track, all gear is reserved, client advances are in and every vendor and permit is confirmed.
      </p>

      <ScheduleEventDialog date={scheduleOpen} onClose={() => setScheduleOpen(null)} />
    </>
  );
}
