import { ArrowLeft, Check, MapPin, Radio, Users } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Meta } from '@/components/ui/Status';
import { PageTabs } from '@/components/ui/Tabs';
import { BlockerList } from '@/components/shared/BlockerList';
import { DetailGrid } from '@/components/shared/Detail';
import { LevelIcon, LevelLabel, useEventReadiness } from '@/components/shared/Readiness';
import { deRigDate, loadInDate, type Phase, type Readiness, type WorkspaceTab } from '@/domain/readiness';
import { usePersona } from '@/hooks/usePermission';
import { cn } from '@/lib/cn';
import { formatRange, formatShortDate } from '@/lib/dates';
import { formatINR, formatNumber } from '@/lib/format';
import { GearTab, JobsTab, MoneyTab } from './OperationsTabs';
import { RunOfShowTab, VendorsTab, WrapUpTab } from './ProductionTabs';

const TABS: { value: WorkspaceTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'jobs', label: 'Job orders' },
  { value: 'gear', label: 'Gear' },
  { value: 'money', label: 'Client payments' },
  { value: 'vendors', label: 'Vendors & permits' },
  { value: 'show', label: 'Run of show' },
  { value: 'wrapup', label: 'Wrap-up' },
];

function Lifecycle({ r }: { r: Readiness }) {
  const e = r.event;
  const stageIndex: Record<Phase, number> = { Preparing: e.status === 'Planning' ? 0 : 1, 'Load-in': 2, Live: 3, 'De-rig': 4, 'Wrap-up': 5, Closed: 6 };
  const current = stageIndex[r.phase];
  const steps = [
    { label: 'Planning', date: 'Booked' },
    { label: 'Pre-production', date: 'Build & book' },
    { label: 'Load-in', date: formatShortDate(loadInDate(e)) },
    { label: 'Show', date: e.start === e.end ? formatShortDate(e.start) : `${formatShortDate(e.start)} – ${formatShortDate(e.end)}` },
    { label: 'De-rig', date: formatShortDate(deRigDate(e)) },
    { label: 'Wrap-up', date: e.closedAt ? 'Closed' : 'Settle & close' },
  ];
  return (
    <ol aria-label="Event lifecycle" className="grid grid-cols-3 gap-y-4 sm:grid-cols-6">
      {steps.map((s, i) => {
        const done = i < current, now = i === current;
        return (
          <li key={s.label} aria-current={now ? 'step' : undefined} className="relative flex flex-col items-start gap-1.5 pr-2">
            <div className="flex w-full items-center">
              <span className={cn('grid size-6 shrink-0 place-items-center rounded-full border-2 text-2xs font-semibold', done ? 'border-success bg-success text-white dark:text-canvas' : now ? 'border-primary bg-primary-soft text-primary' : 'border-line-strong bg-surface text-fg-subtle')}>
                {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              {i < steps.length - 1 && <span aria-hidden className={cn('ml-1.5 h-0.5 flex-1 rounded-full', done ? 'bg-success' : 'bg-line')} />}
            </div>
            <span className={cn('text-xs font-medium', now ? 'text-primary' : done ? 'text-fg' : 'text-fg-subtle')}>{s.label}</span>
            <span className="text-2xs text-fg-subtle tabular">{s.date}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function EventWorkspacePage() {
  const { code } = useParams();
  const [params, setParams] = useSearchParams();
  const persona = usePersona();
  const r = useEventReadiness(code);
  const tab = (params.get('tab') as WorkspaceTab) || 'overview';
  const setTab = (t: WorkspaceTab) => setParams((p) => { const n = new URLSearchParams(p); n.set('tab', t); n.delete('job'); return n; }, { replace: true });

  if (!r) {
    return <Card><EmptyState icon={Users} title="Event not found" description="It may have been removed." action={<Link to="/" className="text-xs font-medium text-primary hover:underline">Back to My events</Link>} /></Card>;
  }
  const e = r.event;

  return (
    <>
      <div className="flex flex-col gap-4">
        <Link to="/" className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-fg-subtle hover:text-fg"><ArrowLeft className="size-3.5" />My events</Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-2xs text-fg-subtle">{e.code}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{e.title}</h1>
            <Meta className="mt-1.5 block text-[13px]" items={[e.client, <span key="v" className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{e.venue}, {e.city}</span>, formatRange(e.start, e.end), `Lead: ${e.lead === persona.name ? 'you' : e.lead}`]} />
          </div>
          <div className="flex items-center gap-3">
            {(r.phase === 'Live' || r.phase === 'Load-in') && <Link to="/show-day" className="inline-flex h-8 items-center gap-2 rounded-md bg-success px-3 text-[13px] font-medium text-white dark:text-canvas"><Radio className="size-3.5" />Show day</Link>}
            <span className={cn('rounded-md px-2.5 py-1.5 text-xs font-semibold tabular', r.phase === 'Live' ? 'bg-success-soft text-success' : r.daysToLoadIn <= 7 && r.phase === 'Preparing' ? 'bg-warning-soft text-warning' : 'bg-muted text-fg-muted')}>{r.countdown}</span>
          </div>
        </div>
      </div>

      <Card className="p-4"><Lifecycle r={r} /></Card>

      <section aria-label="Readiness" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {r.checks.map((c) => (
          <button key={c.key} type="button" onClick={() => setTab(c.key)} className={cn('flex items-start gap-3 rounded-lg border bg-surface p-4 text-left transition-colors hover:bg-subtle', tab === c.key ? 'border-primary/50' : 'border-line')}>
            <LevelIcon level={c.level} className="mt-0.5 size-5" />
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">{c.label}</p>
              <p className="mt-0.5 text-xs text-fg-subtle">{c.summary}</p>
            </div>
          </button>
        ))}
      </section>

      <PageTabs value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t.value, label: t.label }))} />

      {tab === 'overview' && (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card>
            <CardHeader title={r.blockers.length ? `What's left to do · ${r.blockers.length}` : 'Nothing outstanding'} description="Blocked items first. Each opens where it gets fixed." action={<LevelLabel level={r.level} />} />
            <div className="mt-2 border-t border-line"><BlockerList items={r.blockers} me={persona.name} empty="This event is show-ready. Nice work." /></div>
          </Card>
          <Card className="p-4">
            <DetailGrid className="lg:grid-cols-2" items={[
              { label: 'Client', value: e.client },
              { label: 'Format', value: e.format },
              { label: 'Delegates', value: e.capacity ? formatNumber(e.capacity) : 'To be confirmed' },
              { label: 'Budget', value: <span className="font-medium tabular">{formatINR(e.budget)}</span> },
              { label: 'Venue specs', value: e.venueSpec, wide: true },
            ]} />
          </Card>
        </div>
      )}
      {tab === 'jobs' && <JobsTab event={e} />}
      {tab === 'gear' && <GearTab event={e} />}
      {tab === 'money' && <MoneyTab event={e} />}
      {tab === 'vendors' && <VendorsTab event={e} />}
      {tab === 'show' && <RunOfShowTab event={e} />}
      {tab === 'wrapup' && <WrapUpTab event={e} phase={r.phase} />}
    </>
  );
}
