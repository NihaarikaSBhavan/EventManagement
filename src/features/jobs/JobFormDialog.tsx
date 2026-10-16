import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input, Select } from '@/components/ui/Field';
import { SectionTitle } from '@/components/shared/Detail';
import { EventPicker, GearPicker } from '@/components/shared/Pickers';
import { APPROVING_MANAGERS, ASSIGNABLE_EXECUTIVES, DEPARTMENTS, JOB_PRIORITIES, TEAM_LEADS } from '@/domain/constants';
import { nextJobNumber } from '@/domain/selectors';
import type { Department, GearRequest, JobPriority } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { addDays, TODAY } from '@/lib/dates';
import { useAppStore } from '@/store/useAppStore';

export function JobFormDialog({ open, onOpenChange, defaultEvent }: { open: boolean; onOpenChange: (o: boolean) => void; defaultEvent?: string }) {
  const { events, jobs } = useAppStore((s) => s.data);
  const create = useAppStore((s) => s.createJob);
  const [title, setTitle] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [department, setDepartment] = useState<Department>('Production');
  const [priority, setPriority] = useState<JobPriority>('High');
  const [executive, setExecutive] = useState('Gautham Vasudevan');
  const [teamLead, setTeamLead] = useState('Hariprasad Nair');
  const [manager, setManager] = useState('Senthil Kumar');
  const [due, setDue] = useState(addDays(TODAY, 7));
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [gear, setGear] = useState<GearRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setTitle(''); setDeliverables([]); setDraft(''); setGear({}); setErrors({}); setDue(addDays(TODAY, 7));
    setEventCode(defaultEvent ?? events.find((e) => e.status !== 'Completed')?.code ?? '');
  }, [open, events, defaultEvent]);

  const addDeliverable = () => {
    const t = draft.trim();
    if (!t) return;
    setDeliverables((d) => [...d, t]);
    setDraft('');
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Give the job order a title';
    if (!eventCode) e.event = 'Map it to a parent event';
    if (!deliverables.length) e.deliverables = 'Add at least one deliverable';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (notify(create({ title: title.trim(), eventCode, department, priority, executive, teamLead, manager, due, deliverables, gear }))) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="xl" title="Create job order"
      description={eventCode ? <>Order number <span className="font-mono">{nextJobNumber(jobs, eventCode)}</span></> : 'Itemized deliverables and warehouse gear'}
      footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Create job order</Button></>}>
      <div className="flex flex-col gap-6">
        <Field label="Job order title" error={errors.title}>{(p) => <Input {...p} autoFocus placeholder="e.g. Hall B rigging & power distribution" value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>

        <section>
          <SectionTitle>Parent event</SectionTitle>
          <EventPicker name="job-event" value={eventCode} onChange={setEventCode} />
          {errors.event && <p className="mt-1.5 text-xs text-danger">{errors.event}</p>}
        </section>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Department">{(p) => <Select {...p} options={DEPARTMENTS} value={department} onChange={(e) => setDepartment(e.target.value as Department)} />}</Field>
          <Field label="Priority">{(p) => <Select {...p} options={JOB_PRIORITIES} value={priority} onChange={(e) => setPriority(e.target.value as JobPriority)} />}</Field>
          <Field label="Due date">{(p) => <Input {...p} type="date" value={due} onChange={(e) => setDue(e.target.value)} />}</Field>
          <Field label="Assigned executive">{(p) => <Select {...p} options={ASSIGNABLE_EXECUTIVES} value={executive} onChange={(e) => setExecutive(e.target.value)} />}</Field>
          <Field label="Responsible team lead">{(p) => <Select {...p} options={TEAM_LEADS} value={teamLead} onChange={(e) => setTeamLead(e.target.value)} />}</Field>
          <Field label="Approving manager">{(p) => <Select {...p} options={APPROVING_MANAGERS} value={manager} onChange={(e) => setManager(e.target.value)} />}</Field>
        </div>

        <section>
          <SectionTitle>Deliverables checklist</SectionTitle>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addDeliverable(); }}>
            <Input aria-label="New deliverable" placeholder="e.g. Truss load-test certificate" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <Button type="submit"><Plus />Add</Button>
          </form>
          {deliverables.length > 0 && (
            <ol className="mt-2 divide-y divide-line/70 rounded-lg border border-line">
              {deliverables.map((d, i) => (
                <li key={`${d}-${i}`} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                  <span className="w-5 font-mono text-2xs text-fg-subtle">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1">{d}</span>
                  <Button size="icon-sm" variant="ghost" aria-label={`Remove ${d}`} onClick={() => setDeliverables((ds) => ds.filter((_, k) => k !== i))}><X /></Button>
                </li>
              ))}
            </ol>
          )}
          {errors.deliverables && <p className="mt-1.5 text-xs text-danger">{errors.deliverables}</p>}
        </section>

        <section>
          <SectionTitle>Warehouse gear picker</SectionTitle>
          <GearPicker value={gear} onChange={setGear} />
        </section>
      </div>
    </Dialog>
  );
}
