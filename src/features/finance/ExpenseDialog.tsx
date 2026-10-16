import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input, Select } from '@/components/ui/Field';
import { SectionTitle } from '@/components/shared/Detail';
import { EventPicker } from '@/components/shared/Pickers';
import { DEPARTMENTS, HIGH_VALUE_EXPENSE, PROCESSES } from '@/domain/constants';
import type { Department, ExpenseProcess } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { TODAY } from '@/lib/dates';
import { formatINR, parseAmount } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

export function ExpenseDialog({ open, onOpenChange, onRecorded }: { open: boolean; onOpenChange: (o: boolean) => void; onRecorded: () => void }) {
  const events = useAppStore((s) => s.data.events);
  const record = useAppStore((s) => s.recordExpense);
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>('Production');
  const [process, setProcess] = useState<ExpenseProcess>('Stage Rigging');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(TODAY);
  const [eventCode, setEventCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setDescription(''); setAmount(''); setDate(TODAY); setErrors({});
    setEventCode(events.find((e) => e.status !== 'Completed')?.code ?? '');
  }, [open, events]);

  const value = parseAmount(amount);
  const submit = () => {
    const e: Record<string, string> = {};
    if (!description.trim()) e.description = 'Describe the expense';
    if (!(value > 0)) e.amount = 'Enter an amount above ₹0';
    if (!eventCode) e.event = 'Tag the expense to an event';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (notify(record({ description: description.trim(), department, process, amount: value, date, eventCode }))) { onOpenChange(false); onRecorded(); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Record expense" description="Tagged by department and operational process"
      footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Record expense</Button></>}>
      <form className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Description" error={errors.description} className="sm:col-span-2">{(p) => <Input {...p} autoFocus placeholder="e.g. Chain hoist lease — 12 units × 3 days" value={description} onChange={(e) => setDescription(e.target.value)} />}</Field>
          <Field label="Department">{(p) => <Select {...p} options={DEPARTMENTS} value={department} onChange={(e) => setDepartment(e.target.value as Department)} />}</Field>
          <Field label="Operational process">{(p) => <Select {...p} options={PROCESSES} value={process} onChange={(e) => setProcess(e.target.value as ExpenseProcess)} />}</Field>
          <Field label="Amount (₹)" error={errors.amount}
            hint={value > 0 ? `${formatINR(value)} · ${value > HIGH_VALUE_EXPENSE ? 'routes to MD_CEO sign-off' : 'routes to DEPT_HEAD'}` : 'Above ₹5,00,000 routes to MD_CEO'}>
            {(p) => <Input {...p} inputMode="numeric" className="tabular" value={amount} onChange={(e) => setAmount(e.target.value)} />}
          </Field>
          <Field label="Date">{(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
        </div>
        <section>
          <SectionTitle>Event</SectionTitle>
          <EventPicker name="expense-event" value={eventCode} onChange={setEventCode} />
          {errors.event && <p className="mt-1.5 text-xs text-danger">{errors.event}</p>}
        </section>
        <button type="submit" className="hidden" />
      </form>
    </Dialog>
  );
}
