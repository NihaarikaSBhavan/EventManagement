import { ChevronLeft, ChevronRight, ClipboardList, GripVertical, LayoutGrid, Plus, Rows3 } from 'lucide-react';
import { useMemo, useState, type DragEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/Feedback';
import { Progress } from '@/components/ui/Progress';
import { Meta, Priority, Status } from '@/components/ui/Status';
import { Segmented } from '@/components/ui/Tabs';
import { GatedButton } from '@/components/shared/Gate';
import { PageHeader } from '@/components/shared/PageHeader';
import { JOB_FLOW, JOB_STAGES } from '@/domain/constants';
import { isLate, jobProgress } from '@/domain/selectors';
import { jobPriorityTone, jobTone } from '@/domain/tones';
import type { JobOrder, JobStage } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { useCan } from '@/hooks/usePermission';
import { cn } from '@/lib/cn';
import { formatShortDate, TODAY } from '@/lib/dates';
import { formatNumber } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { JobFormDialog } from './JobFormDialog';

function step(stage: JobStage, dir: 1 | -1): JobStage | null {
  if (stage === 'Overdue') return dir > 0 ? 'In Progress' : 'Open';
  return JOB_FLOW[JOB_FLOW.indexOf(stage) + dir] ?? null;
}

export function JobsPage() {
  const { jobs, events, inventory } = useAppStore((s) => s.data);
  const move = useAppStore((s) => s.moveJob);
  const canVerify = useCan('job.verify');
  const { openJob } = useEntityLinks();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [eventFilter, setEventFilter] = useState('All');
  const [dragging, setDragging] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<JobStage | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const eventCodes = useMemo(() => [...new Set(jobs.map((j) => j.eventCode))], [jobs]);
  const rows = jobs.filter((j) => eventFilter === 'All' || j.eventCode === eventFilter);
  const title = (code: string) => events.find((e) => e.code === code)?.title ?? code;
  const gearName = (id: string) => inventory.find((i) => i.id === id)?.shortName ?? id;

  const onDrop = (stage: JobStage) => (e: DragEvent) => {
    e.preventDefault();
    const no = e.dataTransfer.getData('text/plain') || dragging;
    setDragging(null); setOverColumn(null);
    if (no) notify(move(no, stage));
  };

  const columns: Column<JobOrder>[] = [
    { id: 'no', header: 'Order', sortValue: (j) => j.no, cell: (j) => <div><p className="font-mono text-2xs text-fg-subtle">{j.no}</p><p className="font-medium">{j.title}</p></div> },
    { id: 'event', header: 'Parent event', sortValue: (j) => j.eventCode, cell: (j) => <div><p>{title(j.eventCode)}</p><p className="font-mono text-2xs text-fg-subtle">{j.eventCode}</p></div> },
    { id: 'dept', header: 'Department', sortValue: (j) => j.department, cell: (j) => <span className="text-fg-muted">{j.department}</span> },
    { id: 'people', header: 'Exec · TL · approver', cell: (j) => <Meta items={[j.executive, j.teamLead, j.manager]} /> },
    { id: 'prio', header: 'Priority', sortValue: (j) => ['Urgent', 'High', 'Normal'].indexOf(j.priority), cell: (j) => <Priority tone={jobPriorityTone[j.priority]}>{j.priority}</Priority> },
    { id: 'stage', header: 'Stage', sortValue: (j) => JOB_STAGES.indexOf(j.stage), cell: (j) => <Status tone={jobTone[j.stage]}>{j.stage}</Status> },
    { id: 'progress', header: 'Progress', width: '160px', sortValue: (j) => jobProgress(j).percent, cell: (j) => { const p = jobProgress(j); return <div className="flex items-center gap-2"><Progress value={p.percent} tone={p.percent === 100 ? 'success' : 'info'} className="flex-1" label={`${p.percent}%`} /><span className="w-9 text-right font-mono text-xs">{p.percent}%</span></div>; } },
    { id: 'gear', header: 'Reserved gear', cell: (j) => <span className="text-xs text-fg-muted">{j.gear.length ? j.gear.map((g) => `${formatNumber(g.qty)}× ${gearName(g.itemId)}`).join(' · ') : '—'}</span> },
    { id: 'due', header: 'Due', sortValue: (j) => j.due, cell: (j) => <span className={cn('tabular', isLate(j, TODAY) && 'font-medium text-danger')}>{formatShortDate(j.due)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Project management & job orders"
        description="Job orders mapped to parent events — deliverable checklists, hardware allocation and stage flow."
        actions={<GatedButton permission="job.create" variant="primary" onClick={() => setFormOpen(true)}><Plus />Create job order</GatedButton>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Event" value={eventFilter} onChange={setEventFilter}
          options={[{ value: 'All', label: 'All events', count: jobs.length }, ...eventCodes.map((c) => ({ value: c, label: c.replace(/^EV-\d{4}-/, ''), count: jobs.filter((j) => j.eventCode === c).length }))]} />
        <Segmented label="View" value={view} onChange={setView} options={[{ value: 'board', label: 'Kanban board' }, { value: 'list', label: 'Tabular list' }]} />
      </div>
      <p className="-mt-3 flex items-center gap-1.5 text-xs text-fg-subtle">
        {view === 'board' ? <LayoutGrid className="size-3.5" /> : <Rows3 className="size-3.5" />}
        Drag a card between columns or use its arrows. Ticking every deliverable sends the order to Pending Review{canVerify ? '.' : ' — completion needs a TEAM_LEAD.'}
      </p>

      {rows.length === 0 ? (
        <Card><EmptyState icon={ClipboardList} title="No job orders for this event" /></Card>
      ) : view === 'board' ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
          <div className="grid min-w-[1320px] grid-cols-5 items-start gap-3">
            {JOB_STAGES.map((stage) => {
              const cards = rows.filter((j) => j.stage === stage);
              return (
                <section
                  key={stage}
                  aria-label={stage}
                  onDragOver={(e) => { e.preventDefault(); setOverColumn(stage); }}
                  onDragLeave={() => setOverColumn((c) => (c === stage ? null : c))}
                  onDrop={onDrop(stage)}
                  className={cn('flex min-h-[320px] flex-col gap-2 rounded-xl border border-transparent bg-subtle p-2 transition-colors', overColumn === stage && 'border-primary/40 bg-primary-soft/40')}
                >
                  <header className="flex items-center justify-between px-1.5 py-1">
                    <Status tone={jobTone[stage]}>{stage}</Status>
                    <span className="font-mono text-2xs text-fg-subtle">{cards.length}</span>
                  </header>
                  {cards.map((j) => {
                    const p = jobProgress(j);
                    const prev = step(j.stage, -1), next = step(j.stage, 1);
                    return (
                      <article
                        key={j.no}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', j.no); e.dataTransfer.effectAllowed = 'move'; setDragging(j.no); }}
                        onDragEnd={() => { setDragging(null); setOverColumn(null); }}
                        className={cn('group flex cursor-grab flex-col gap-2.5 rounded-lg border border-line bg-surface p-3 transition active:cursor-grabbing', dragging === j.no && 'opacity-50')}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 font-mono text-2xs text-fg-subtle"><GripVertical aria-hidden className="size-3 opacity-0 group-hover:opacity-100" />{j.no}</span>
                          <Priority tone={jobPriorityTone[j.priority]}>{j.priority}</Priority>
                        </div>
                        <button type="button" onClick={() => openJob(j.no)} className="text-left text-[13px] font-medium leading-5 hover:text-primary">{j.title}</button>
                        <Meta items={[title(j.eventCode), j.department]} />
                        <div className="flex items-center gap-2">
                          <Progress value={p.percent} tone={p.percent === 100 ? 'success' : 'info'} className="flex-1" label={`${p.percent}% complete`} />
                          <span className="font-mono text-2xs font-medium">{p.percent}%</span>
                        </div>
                        <div className="flex justify-between text-2xs text-fg-subtle">
                          <span>{p.done}/{p.total} deliverables</span>
                          <span className={cn(isLate(j, TODAY) && 'font-medium text-danger')}>Due {formatShortDate(j.due)}</span>
                        </div>
                        {j.gear.length > 0 && (
                          <ul className="space-y-0.5 border-t border-line pt-2">
                            {j.gear.map((g) => <li key={g.itemId} className="flex justify-between text-2xs text-fg-muted"><span>{gearName(g.itemId)}</span><span className="font-mono">{formatNumber(g.qty)}</span></li>)}
                          </ul>
                        )}
                        <div className="flex items-center justify-between border-t border-line pt-2">
                          <span className="truncate text-2xs text-fg-subtle">{j.executive}</span>
                          <div className="flex gap-0.5">
                            <Button size="icon-sm" variant="ghost" aria-label={`Move ${j.no} back to ${prev ?? 'previous stage'}`} disabled={!prev} onClick={() => prev && notify(move(j.no, prev))}><ChevronLeft /></Button>
                            <Button size="icon-sm" variant="ghost" aria-label={`Move ${j.no} to ${next ?? 'next stage'}`} disabled={!next} onClick={() => next && notify(move(j.no, next))}><ChevronRight /></Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {cards.length === 0 && <p className="rounded-lg border border-dashed border-line-strong/60 px-3 py-6 text-center text-2xs text-fg-subtle">Drop here</p>}
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <Card><DataTable rows={rows} columns={columns} rowKey={(j) => j.no} onRowClick={(j) => openJob(j.no)} minWidth={1400} /></Card>
      )}

      <JobFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
