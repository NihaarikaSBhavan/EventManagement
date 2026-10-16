import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { SectionTitle } from '@/components/shared/Detail';
import { GearPicker } from '@/components/shared/Pickers';
import { ASSIGNABLE_EXECUTIVES, CITY_STATE, LEAD_PRIORITIES, LEAD_STAGES, STATES } from '@/domain/constants';
import type { Lead } from '@/domain/types';
import { isValidEmail, type FieldErrors } from '@/domain/validation';
import { notify } from '@/hooks/useAction';
import { usePersona } from '@/hooks/usePermission';
import { formatINR, parseAmount } from '@/lib/format';
import { useAppStore, type LeadInput } from '@/store/useAppStore';

type Draft = Omit<LeadInput, 'value'> & { value: string };
type Key = 'organization' | 'contact' | 'value' | 'email';

function blank(executive: string): Draft {
  return { organization: '', contact: '', email: '', phone: '', address: '', city: '', state: 'Tamil Nadu', product: '', value: '', kits: '', gear: {}, executive, priority: 'Medium', stage: 'New Inbound', notes: '' };
}

export function LeadFormDialog({ lead, open, onOpenChange }: { lead: Lead | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const persona = usePersona();
  const save = useAppStore((s) => s.saveLead);
  const [draft, setDraft] = useState<Draft>(() => blank(persona.name));
  const [errors, setErrors] = useState<FieldErrors<Key>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setDraft(lead ? { ...lead, value: String(lead.value), gear: { ...lead.gear } } : blank(persona.role === 'EXECUTIVE' ? persona.name : 'Keerthana Murali'));
  }, [open, lead, persona]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const value = parseAmount(draft.value);

  const submit = () => {
    const e: FieldErrors<Key> = {};
    if (!draft.organization.trim()) e.organization = 'Required';
    if (!draft.contact.trim()) e.contact = 'Required';
    if (!(value > 0)) e.value = 'Enter a deal value above ₹0';
    if (!isValidEmail(draft.email)) e.email = 'Enter a valid email';
    setErrors(e);
    if (Object.keys(e).length) return;
    const { value: _v, ...rest } = draft;
    if (notify(save({ ...rest, organization: draft.organization.trim(), contact: draft.contact.trim(), city: draft.city.trim() || 'Chennai', value }, lead?.id))) onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={lead ? `Edit lead dossier` : 'New lead dossier'}
      description={lead ? <span className="font-mono">{lead.id}</span> : 'Gear quantities are reserved when the lead converts to an event'}
      footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={submit}>{lead ? 'Save changes' : 'Create lead'}</Button></>}
    >
      <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <section>
          <SectionTitle>Contact dossier</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact person name" error={errors.contact}>{(p) => <Input {...p} value={draft.contact} onChange={(e) => set('contact', e.target.value)} autoFocus />}</Field>
            <Field label="Organization / corporate entity" error={errors.organization}>{(p) => <Input {...p} value={draft.organization} onChange={(e) => set('organization', e.target.value)} />}</Field>
            <Field label="Email" error={errors.email}>{(p) => <Input {...p} type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />}</Field>
            <Field label="Phone number">{(p) => <Input {...p} type="tel" placeholder="+91 98400 00000" value={draft.phone} onChange={(e) => set('phone', e.target.value)} />}</Field>
            <Field label="Physical address" className="sm:col-span-2">{(p) => <Input {...p} value={draft.address} onChange={(e) => set('address', e.target.value)} />}</Field>
            <Field label="City">{(p) => <Input {...p} value={draft.city} onChange={(e) => { set('city', e.target.value); const st = CITY_STATE[e.target.value.trim()]; if (st) set('state', st); }} />}</Field>
            <Field label="State">{(p) => <Select {...p} options={STATES} value={draft.state} onChange={(e) => set('state', e.target.value as Draft['state'])} />}</Field>
          </div>
        </section>

        <section>
          <SectionTitle>Opportunity</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Requested event product" className="lg:col-span-2">{(p) => <Input {...p} placeholder="e.g. Annual Dealer Awards Night" value={draft.product} onChange={(e) => set('product', e.target.value)} />}</Field>
            <Field label="Deal value (₹ INR)" error={errors.value} hint={value > 0 ? formatINR(value) : 'Indian grouping, e.g. 27,00,000'}>{(p) => <Input {...p} inputMode="numeric" className="tabular" value={draft.value} onChange={(e) => set('value', e.target.value)} />}</Field>
            <Field label="Assigned executive">{(p) => <Select {...p} options={ASSIGNABLE_EXECUTIVES} value={draft.executive} onChange={(e) => set('executive', e.target.value)} />}</Field>
            <Field label="Priority">{(p) => <Select {...p} options={LEAD_PRIORITIES} value={draft.priority} onChange={(e) => set('priority', e.target.value as Draft['priority'])} />}</Field>
            <Field label="Stage">{(p) => <Select {...p} options={LEAD_STAGES} value={draft.stage} onChange={(e) => set('stage', e.target.value as Draft['stage'])} />}</Field>
            <Field label="Required inventory kits" className="sm:col-span-2 lg:col-span-3">{(p) => <Input {...p} placeholder="Curved LED Wall, JBL Line Array, 30 Octanorm Stalls" value={draft.kits} onChange={(e) => set('kits', e.target.value)} />}</Field>
            <Field label="Discovery notes" className="sm:col-span-2 lg:col-span-3">{(p) => <Textarea {...p} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />}</Field>
          </div>
        </section>

        <section>
          <SectionTitle>Warehouse gear to reserve on conversion</SectionTitle>
          <GearPicker value={draft.gear} onChange={(g) => set('gear', g)} />
        </section>
        <button type="submit" className="hidden" />
      </form>
    </Dialog>
  );
}
