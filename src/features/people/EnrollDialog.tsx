import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Input, Select } from '@/components/ui/Field';
import { SectionTitle } from '@/components/shared/Detail';
import { DEPARTMENTS, HUBS } from '@/domain/constants';
import { payBreakdown } from '@/domain/selectors';
import type { Department, Hub } from '@/domain/types';
import { isValidPan } from '@/domain/validation';
import { notify } from '@/hooks/useAction';
import { formatINR, parseAmount } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

const REPORTS_TO = ['K. Sundararajan', 'Anandha Krishnan', 'Senthil Kumar', 'Hariprasad Nair'];
const TEAM_LEAD_OPTIONS = [{ value: '', label: 'None' }, 'Hariprasad Nair', 'Keerthana Murali', 'Arjun Reddy Kotha'];

const initial = { name: '', designation: '', department: 'Production' as Department, location: 'Chennai' as Hub, reportsTo: 'Senthil Kumar', teamLead: 'Hariprasad Nair', basic: '', hra: '', site: '', leave: '12', bankName: '', account: '', pan: '' };

export function EnrollDialog({ open, onOpenChange, onEnrolled }: { open: boolean; onOpenChange: (o: boolean) => void; onEnrolled: () => void }) {
  const enroll = useAppStore((s) => s.enroll);
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof initial) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const basic = parseAmount(f.basic), hra = parseAmount(f.hra) || 0, site = parseAmount(f.site) || 0;
  const gross = (basic || 0) + hra + site;
  const projected = basic > 0 ? payBreakdown({ basic, hra, siteAllowance: site, tds: Math.round(gross * 0.08), pf: Math.round(basic * 0.12) }).net : null;

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Required';
    if (!f.designation.trim()) e.designation = 'Required';
    if (!(basic > 0)) e.basic = 'Enter basic salary above ₹0';
    if (!isValidPan(f.pan)) e.pan = 'Format ABCDE1234F';
    if (f.account.replace(/\D/g, '').length < 4) e.account = 'Enter the account number';
    setErrors(e);
    if (Object.keys(e).length) return;
    const ok = notify(enroll({
      name: f.name.trim(), designation: f.designation.trim(), department: f.department, location: f.location, reportsTo: f.reportsTo,
      teamLead: f.teamLead || null, basic, hra, siteAllowance: site, leaveBalance: Math.floor(parseAmount(f.leave)) || 12, pan: f.pan.trim(),
      bankName: f.bankName.trim() || 'Bank', accountNumber: f.account.replace(/\D/g, ''),
    }));
    if (ok) { setF(initial); onOpenChange(false); onEnrolled(); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="xl" title="Enroll new personnel" description="Creates the staff record and a Draft line on this month's payroll"
      footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Enroll</Button></>}>
      <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <section>
          <SectionTitle>Role & reporting</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full name" error={errors.name}>{(p) => <Input {...p} autoFocus value={f.name} onChange={set('name')} />}</Field>
            <Field label="Designation" error={errors.designation}>{(p) => <Input {...p} placeholder="e.g. LED Systems Technician" value={f.designation} onChange={set('designation')} />}</Field>
            <Field label="Department">{(p) => <Select {...p} options={DEPARTMENTS} value={f.department} onChange={set('department')} />}</Field>
            <Field label="Location">{(p) => <Select {...p} options={HUBS} value={f.location} onChange={set('location')} />}</Field>
            <Field label="Reporting line">{(p) => <Select {...p} options={REPORTS_TO} value={f.reportsTo} onChange={set('reportsTo')} />}</Field>
            <Field label="Team lead">{(p) => <Select {...p} options={TEAM_LEAD_OPTIONS} value={f.teamLead} onChange={set('teamLead')} />}</Field>
          </div>
        </section>
        <section>
          <SectionTitle>Compensation · monthly</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Basic salary (₹)" error={errors.basic}>{(p) => <Input {...p} inputMode="numeric" value={f.basic} onChange={set('basic')} />}</Field>
            <Field label="HRA (₹)">{(p) => <Input {...p} inputMode="numeric" value={f.hra} onChange={set('hra')} />}</Field>
            <Field label="Site allowances (₹)">{(p) => <Input {...p} inputMode="numeric" value={f.site} onChange={set('site')} />}</Field>
            <Field label="Leave balance (days)">{(p) => <Input {...p} inputMode="numeric" value={f.leave} onChange={set('leave')} />}</Field>
          </div>
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-line bg-subtle px-3 py-2.5">
            <span className="text-xs text-fg-subtle">Projected net · TDS estimated at 8% of gross, PF at 12% of basic</span>
            <span className="text-sm font-semibold tabular">{projected === null ? '—' : formatINR(projected)}</span>
          </div>
        </section>
        <section>
          <SectionTitle>Statutory & bank</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Bank name">{(p) => <Input {...p} placeholder="e.g. Indian Overseas Bank" value={f.bankName} onChange={set('bankName')} />}</Field>
            <Field label="Account number" error={errors.account} hint="Only the last 4 digits are stored">{(p) => <Input {...p} className="font-mono" inputMode="numeric" value={f.account} onChange={set('account')} />}</Field>
            <Field label="PAN card number" error={errors.pan}>{(p) => <Input {...p} className="font-mono uppercase" placeholder="ABCDE1234F" value={f.pan} onChange={set('pan')} />}</Field>
          </div>
        </section>
        <button type="submit" className="hidden" />
      </form>
    </Dialog>
  );
}
