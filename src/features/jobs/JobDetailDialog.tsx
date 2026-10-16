import { Check } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { Progress } from '@/components/ui/Progress';
import { Priority, Status } from '@/components/ui/Status';
import { DetailGrid, SectionTitle } from '@/components/shared/Detail';
import { DEPOT_SHORT, JOB_STAGES } from '@/domain/constants';
import { isLate, jobProgress } from '@/domain/selectors';
import { jobPriorityTone, jobTone } from '@/domain/tones';
import type { JobStage } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { useCan } from '@/hooks/usePermission';
import { cn } from '@/lib/cn';
import { formatDate, TODAY } from '@/lib/dates';
import { formatNumber } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

export function JobDetailDialog() {
  const { jobNo, openEvent, close } = useEntityLinks();
  const data = useAppStore((s) => s.data);
  const move = useAppStore((s) => s.moveJob);
  const toggle = useAppStore((s) => s.toggleDeliverable);
  const canVerify = useCan('job.verify');
  const job = data.jobs.find((j) => j.no === jobNo);
  if (!job) return null;

  const event = data.events.find((e) => e.code === job.eventCode);
  const progress = jobProgress(job);
  const locked = job.stage === 'Completed';

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && close()}
      title={job.title}
      description={<span className="font-mono">{job.no}</span>}
      size="lg"
      footer={<Button onClick={close}>Done</Button>}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Status tone={jobTone[job.stage]}>{job.stage}</Status>
            <Priority tone={jobPriorityTone[job.priority]}>{job.priority}</Priority>
          </div>
          <label className="flex items-center gap-2 text-xs text-fg-subtle">
            Completion stage
            <Select className="w-44" value={job.stage} options={JOB_STAGES} onChange={(e) => notify(move(job.no, e.target.value as JobStage))} />
          </label>
        </div>

        <DetailGrid
          items={[
            { label: 'Parent event', value: event ? <button type="button" className="text-left font-medium text-primary hover:underline" onClick={() => openEvent(event.code)}>{event.title}</button> : job.eventCode },
            { label: 'Department', value: job.department },
            { label: 'Due', value: <span className={cn(isLate(job, TODAY) && 'font-medium text-danger')}>{formatDate(job.due)}</span> },
            { label: 'Assigned executive', value: job.executive },
            { label: 'Responsible team lead', value: job.teamLead },
            { label: 'Approving manager', value: job.manager },
          ]}
        />

        <section>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle>Deliverables checklist</SectionTitle>
            <span className="font-mono text-xs text-fg-muted">{progress.done}/{progress.total} · {progress.percent}%</span>
          </div>
          <Progress value={progress.percent} tone={progress.percent === 100 ? 'success' : 'info'} className="mb-3 h-2" label="Milestone progress" />
          <ul className="divide-y divide-line/70 rounded-lg border border-line">
            {job.deliverables.map((d) => (
              <li key={d.id}>
                <label className={cn('flex min-h-11 items-center gap-3 px-3 py-2 text-[13px]', locked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-subtle')}>
                  <input type="checkbox" className="peer sr-only" checked={d.done} disabled={locked} onChange={() => notify(toggle(job.no, d.id))} />
                  <span aria-hidden className={cn('grid size-4 shrink-0 place-items-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50', d.done ? 'border-success bg-success text-white dark:text-canvas' : 'border-line-strong bg-surface')}>
                    {d.done && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className={cn(d.done && 'text-fg-subtle line-through')}>{d.text}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-fg-subtle">
            {locked
              ? 'Completed orders are locked — reserved gear has been released back to the depot.'
              : `Reaching 100% moves the order to Pending Review. ${canVerify ? 'You can mark it Completed after QC.' : 'A TEAM_LEAD marks it Completed after QC.'}`}
          </p>
        </section>

        <section>
          <SectionTitle>Connected hardware allocation</SectionTitle>
          {job.gear.length ? (
            <ul className="divide-y divide-line/70 rounded-lg border border-line">
              {job.gear.map((g) => {
                const item = data.inventory.find((i) => i.id === g.itemId);
                return (
                  <li key={g.itemId} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                    <span>{item?.name ?? g.itemId} <span className="text-xs text-fg-subtle">· {item ? DEPOT_SHORT[item.depot] : ''}</span></span>
                    <span className="font-mono text-xs font-medium">{formatNumber(g.qty)} units</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-fg-subtle">No warehouse gear reserved on this order.</p>
          )}
        </section>
      </div>
    </Dialog>
  );
}
