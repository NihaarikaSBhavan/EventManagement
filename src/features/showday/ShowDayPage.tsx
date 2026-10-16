import { AlertTriangle, Check, CheckCircle2, Clock, Radio, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { Textarea } from '@/components/ui/Field';
import { Progress } from '@/components/ui/Progress';
import { Segmented } from '@/components/ui/Tabs';
import { useActiveReadiness } from '@/components/shared/Readiness';
import { jobProgress } from '@/domain/selectors';
import { notify } from '@/hooks/useAction';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { cn } from '@/lib/cn';
import { formatDate, formatStamp, TODAY } from '@/lib/dates';
import { useAppStore } from '@/store/useAppStore';

/** Phone-first view for the crew chief on site: what's next, tick it, flag problems. */
export function ShowDayPage() {
  const data = useAppStore((s) => s.data);
  const toggle = useAppStore((s) => s.toggleRunItem);
  const report = useAppStore((s) => s.reportIssue);
  const resolve = useAppStore((s) => s.resolveIssue);
  const { openJob, openEvent } = useEntityLinks();
  const active = useActiveReadiness();
  const onSite = active.filter((r) => ['Load-in', 'Live', 'De-rig'].includes(r.phase));
  const [picked, setPicked] = useState<string | null>(null);
  const [issue, setIssue] = useState('');
  const current = onSite.find((r) => r.event.code === picked) ?? onSite[0];

  const today = useMemo(() => (current ? data.runOfShow.filter((i) => i.eventCode === current.event.code && i.date === TODAY).sort((a, b) => a.time.localeCompare(b.time)) : []), [data.runOfShow, current]);

  if (!current) {
    const next = active.find((r) => r.phase === 'Preparing');
    return (
      <Card>
        <EmptyState icon={Radio} title="Nothing is on site today"
          description={next ? `Next up: ${next.event.title} at ${next.event.venue} · ${next.countdown.toLowerCase()}.` : 'No upcoming events.'}
          action={next ? <Button onClick={() => openEvent(next.event.code)}>Open {next.event.title}</Button> : undefined} />
      </Card>
    );
  }

  const e = current.event;
  const upNext = today.find((i) => !i.done);
  const issues = data.issues.filter((i) => i.eventCode === e.code && !i.resolvedAt);
  const jobs = data.jobs.filter((j) => j.eventCode === e.code && j.stage !== 'Completed');
  const doneCount = today.filter((i) => i.done).length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success">
          <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" /><span className="relative inline-flex size-2 rounded-full bg-success" /></span>
          {current.countdown}
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{e.title}</h1>
          <p className="mt-1 text-[13px] text-fg-muted">{e.venue} · {formatDate(TODAY)}</p>
        </div>
        {onSite.length > 1 && <Segmented label="Event" value={e.code} onChange={setPicked} options={onSite.map((r) => ({ value: r.event.code, label: r.event.title }))} />}
      </header>

      {upNext ? (
        <Card className="border-primary/40 p-4">
          <p className="text-2xs font-semibold uppercase tracking-wider text-primary">Up next</p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-mono text-2xl font-semibold tabular">{upNext.time}</span>
            <span className="text-base font-medium">{upNext.title}</span>
          </div>
          <p className="mt-1 text-xs text-fg-subtle">Owner: {upNext.owner}</p>
          <Button variant="primary" size="lg" className="mt-4 h-12 w-full text-[15px]" onClick={() => notify(toggle(upNext.id))}><Check />Mark done</Button>
        </Card>
      ) : today.length ? (
        <Card className="flex items-center gap-3 border-success/40 bg-success-soft p-4"><CheckCircle2 className="size-5 text-success" /><p className="text-sm font-medium text-success">Every cue for today is done.</p></Card>
      ) : null}

      <Card>
        <CardHeader title="Today's run of show" description={today.length ? `${doneCount} of ${today.length} done` : 'No cues scheduled for today'}
          action={<Button size="sm" variant="ghost" onClick={() => openEvent(e.code, 'show')}>Edit cues</Button>} />
        {today.length > 0 && <Progress value={(doneCount / today.length) * 100} tone="success" className="mx-4 mt-3" label="Run of show progress" />}
        <ul className="mt-3 divide-y divide-line/70 border-t border-line">
          {today.map((i) => (
            <li key={i.id}>
              <label className={cn('flex min-h-14 cursor-pointer items-center gap-4 px-4 py-2 active:bg-muted', upNext?.id === i.id && 'bg-primary-soft/50')}>
                <input type="checkbox" className="peer sr-only" checked={i.done} onChange={() => notify(toggle(i.id))} />
                <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center rounded-md border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50', i.done ? 'border-success bg-success text-white dark:text-canvas' : 'border-line-strong')}>{i.done && <Check className="size-4" strokeWidth={3} />}</span>
                <span className="w-12 font-mono text-[13px] font-medium text-fg-muted">{i.time}</span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block text-[14px]', i.done && 'text-fg-subtle line-through')}>{i.title}</span>
                  <span className="block text-xs text-fg-subtle">{i.owner}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title={issues.length ? `Open issues · ${issues.length}` : 'No open issues'} description="Anything going wrong on site. It shows on the event and in alerts until resolved." />
        <ul className="mt-3 divide-y divide-line/70 border-t border-line">
          {issues.map((i) => (
            <li key={i.id} className="flex items-start gap-3 px-4 py-3">
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
              <div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{i.text}</p><p className="text-xs text-fg-subtle">{i.raisedBy} · {formatStamp(i.raisedAt)}</p></div>
              <Button size="sm" onClick={() => notify(resolve(i.id))}>Resolve</Button>
            </li>
          ))}
        </ul>
        <form className="flex flex-col gap-2 border-t border-line p-4" onSubmit={(ev) => { ev.preventDefault(); if (issue.trim() && notify(report(e.code, issue.trim()))) setIssue(''); }}>
          <label htmlFor="issue" className="text-xs font-medium text-fg-muted">Report an issue</label>
          <Textarea id="issue" className="min-h-[64px]" placeholder="e.g. Generator 2 tripped at 11:40, running on mains" value={issue} onChange={(ev) => setIssue(ev.target.value)} />
          <Button type="submit" variant="danger" size="lg" disabled={!issue.trim()} className="h-11"><Send />Report issue</Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Crew on duty" description="Open job orders for this event" />
        <ul className="mt-3 divide-y divide-line/70 border-t border-line">
          {jobs.map((j) => {
            const p = jobProgress(j);
            return (
              <li key={j.no}>
                <button type="button" onClick={() => openJob(j.no)} className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left active:bg-muted">
                  <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{j.title}</p><p className="text-xs text-fg-subtle">{j.executive} · TL {j.teamLead}</p></div>
                  <span className="font-mono text-xs">{p.percent}%</span>
                </button>
              </li>
            );
          })}
          {jobs.length === 0 && <li className="px-4 py-4 text-xs text-fg-subtle">All job orders for this event are complete.</li>}
        </ul>
      </Card>

      <Link to={`/events/${e.code}`} className="inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary hover:underline"><Clock className="size-3.5" />Open the full event workspace</Link>
    </div>
  );
}
