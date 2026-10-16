import { Handshake, IndianRupee, Plus, ShieldCheck, Star, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/Feedback';
import { Field, Input, Select } from '@/components/ui/Field';
import { Stat } from '@/components/ui/Stat';
import { Meta, Status } from '@/components/ui/Status';
import { Segmented } from '@/components/ui/Tabs';
import { DetailGrid, SectionTitle } from '@/components/shared/Detail';
import { GatedButton } from '@/components/shared/Gate';
import { PageHeader } from '@/components/shared/PageHeader';
import { HUBS, PAYMENT_TERMS, SPECIALTIES, VENDOR_STATUSES } from '@/domain/constants';
import { documentTotal } from '@/domain/selectors';
import { invoiceTone, vendorTone } from '@/domain/tones';
import type { Hub, PaymentTerms, Vendor, VendorSpecialty, VendorStatus } from '@/domain/types';
import { isValidEmail, isValidGstin } from '@/domain/validation';
import { notify } from '@/hooks/useAction';
import { useCan } from '@/hooks/usePermission';
import { cn } from '@/lib/cn';
import { formatINR } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} aria-hidden className={cn('size-3.5', n <= rating ? 'fill-warning text-warning' : 'text-line-strong')} />)}
    </span>
  );
}

export function VendorsPage() {
  const vendors = useAppStore((s) => s.data.vendors);
  const setStatus = useAppStore((s) => s.setVendorStatus);
  const canStatus = useCan('vendor.setStatus');
  const [specialty, setSpecialty] = useState<'All' | VendorSpecialty>('All');
  const [hub, setHub] = useState<'All' | Hub>('All');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const rows = useMemo(() => vendors.filter((v) => (specialty === 'All' || v.specialty === specialty) && (hub === 'All' || v.hub === hub)), [vendors, specialty, hub]);

  const columns: Column<Vendor>[] = [
    { id: 'name', header: 'Vendor', sortValue: (v) => v.name, cell: (v) => <div><p className="font-medium">{v.name}</p><p className="font-mono text-2xs text-fg-subtle">{v.gstin}</p></div> },
    { id: 'spec', header: 'Specialty', sortValue: (v) => v.specialty, cell: (v) => <span className="text-fg-muted">{v.specialty}</span> },
    { id: 'hub', header: 'Hub', sortValue: (v) => v.hub, cell: (v) => v.hub },
    { id: 'contact', header: 'Key contact', cell: (v) => <div><p>{v.contact}</p><p className="font-mono text-2xs text-fg-subtle">{v.phone}</p></div> },
    { id: 'terms', header: 'Payment terms', sortValue: (v) => v.terms, cell: (v) => <span className="text-fg-muted">{v.terms}</span> },
    { id: 'rating', header: 'Rating', sortValue: (v) => v.rating, cell: (v) => <Stars rating={v.rating} /> },
    { id: 'spend', header: 'Total spend', align: 'right', sortValue: (v) => v.totalSpend, cell: (v) => <span className="font-medium tabular">{formatINR(v.totalSpend)}</span> },
    { id: 'pos', header: 'POs', align: 'right', sortValue: (v) => v.activePOs, cell: (v) => <span className="tabular">{v.activePOs}</span> },
    {
      id: 'status', header: 'Status', width: '160px', sortValue: (v) => v.status,
      cell: (v) => canStatus ? (
        <div onClick={(e) => e.stopPropagation()}>
          <Select aria-label={`Status for ${v.name}`} value={v.status} options={VENDOR_STATUSES} onChange={(e) => notify(setStatus(v.id, e.target.value as VendorStatus))} />
        </div>
      ) : <Status tone={vendorTone[v.status]}>{v.status}</Status>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Subcontractor vendors & logistics"
        description="Trade partners separate from internal departments — specialties, GSTIN, payment terms and network tier."
        actions={<GatedButton permission="vendor.register" variant="primary" onClick={() => setRegisterOpen(true)}><Plus />Register vendor</GatedButton>}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Registered trade partners" icon={Handshake} value={vendors.length} footnote={`across ${new Set(vendors.map((v) => v.hub)).size} regional hubs`} />
        <Stat label="Preferred network tier" icon={ShieldCheck} value={vendors.filter((v) => v.status === 'Preferred').length} footnote={`${vendors.filter((v) => v.status === 'Under Review').length} under review`} />
        <Stat label="Total spend" icon={IndianRupee} value={formatINR(vendors.reduce((s, v) => s + v.totalSpend, 0))} footnote="FY 2026–27 to date" />
        <Stat label="Active purchase orders" icon={Truck} value={vendors.reduce((s, v) => s + v.activePOs, 0)} footnote="open with subcontractors" />
      </section>

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <Select aria-label="Filter by specialty" className="w-56" value={specialty} onChange={(e) => setSpecialty(e.target.value as typeof specialty)} options={[{ value: 'All', label: 'All specialties' }, ...SPECIALTIES]} />
        <Segmented label="Hub" value={hub} onChange={setHub} options={[{ value: 'All' as const, label: 'All hubs' }, ...HUBS.map((h) => ({ value: h, label: h }))]} />
        <p className="ml-auto text-xs text-fg-subtle">{rows.length} vendors · <span className="tabular">{formatINR(rows.reduce((s, v) => s + v.totalSpend, 0))}</span>{!canStatus && ' · status changes need DEPT_HEAD+'}</p>
      </Card>

      <Card>
        <DataTable rows={rows} columns={columns} rowKey={(v) => v.id} onRowClick={(v) => setProfileId(v.id)} minWidth={1320}
          empty={<EmptyState icon={Truck} title="No vendors match" description="Try another specialty or hub." />} />
      </Card>

      <VendorProfileDialog vendorId={profileId} onClose={() => setProfileId(null)} />
      <RegisterVendorDialog open={registerOpen} onOpenChange={setRegisterOpen} />
    </>
  );
}

function VendorProfileDialog({ vendorId, onClose }: { vendorId: string | null; onClose: () => void }) {
  const vendor = useAppStore((s) => s.data.vendors.find((v) => v.id === vendorId));
  const bills = useAppStore((s) => s.data.bills);
  const setStatus = useAppStore((s) => s.setVendorStatus);
  const canStatus = useCan('vendor.setStatus');
  if (!vendor) return null;
  const own = bills.filter((b) => b.vendor === vendor.name);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={vendor.name} description={`${vendor.specialty} · ${vendor.hub}`} size="lg" footer={<Button onClick={onClose}>Close</Button>}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Status tone={vendorTone[vendor.status]}>{vendor.status}</Status>
          {canStatus && <Segmented label="Vendor status" value={vendor.status} onChange={(s) => notify(setStatus(vendor.id, s))} options={VENDOR_STATUSES.map((s) => ({ value: s, label: s }))} />}
        </div>
        <DetailGrid items={[
          { label: 'Key contact', value: vendor.contact },
          { label: 'Phone', value: <a className="font-mono hover:text-primary" href={`tel:${vendor.phone.replace(/\s/g, '')}`}>{vendor.phone}</a> },
          { label: 'Email', value: <a className="hover:text-primary" href={`mailto:${vendor.email}`}>{vendor.email}</a> },
          { label: 'GSTIN', value: <span className="font-mono">{vendor.gstin}</span> },
          { label: 'Payment terms', value: vendor.terms },
          { label: 'Performance', value: <Stars rating={vendor.rating} /> },
          { label: 'Total spend', value: <span className="font-medium tabular">{formatINR(vendor.totalSpend)}</span> },
          { label: 'Active POs', value: vendor.activePOs },
        ]} />
        <section>
          <SectionTitle>Bills on file</SectionTitle>
          {own.length ? (
            <ul className="divide-y divide-line/70 rounded-lg border border-line">
              {own.map((b) => (
                <li key={b.no} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px]">
                  <span className="min-w-0 truncate"><span className="font-mono text-xs text-fg-subtle">{b.no}</span> · {b.description}</span>
                  <span className="flex shrink-0 items-center gap-3 tabular">{formatINR(documentTotal(b))}<Status tone={invoiceTone[b.status]}>{b.status}</Status></span>
                </li>
              ))}
            </ul>
          ) : <p className="text-xs text-fg-subtle">No bills logged for this vendor yet.</p>}
        </section>
      </div>
    </Dialog>
  );
}

function RegisterVendorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const register = useAppStore((s) => s.registerVendor);
  const initial = { name: '', specialty: SPECIALTIES[0] as VendorSpecialty, hub: 'Chennai' as Hub, contact: '', phone: '', email: '', gstin: '', terms: 'Net 30 Days' as PaymentTerms, rating: 4, status: 'Under Review' as VendorStatus };
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Required';
    if (!f.contact.trim()) e.contact = 'Required';
    if (!isValidGstin(f.gstin)) e.gstin = '15 characters, e.g. 33AAJFP4821K1Z7';
    if (!isValidEmail(f.email)) e.email = 'Enter a valid email';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (notify(register({ ...f, name: f.name.trim(), contact: f.contact.trim(), gstin: f.gstin.trim().toUpperCase(), phone: f.phone || '—', email: f.email || '—' }))) {
      setF(initial);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Register vendor" description="New subcontractor or logistics supplier"
      footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Register vendor</Button></>}>
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="Vendor / firm name" error={errors.name} className="sm:col-span-2">{(p) => <Input {...p} autoFocus placeholder="e.g. Thanjavur Stage Craft" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
        <Field label="Specialty">{(p) => <Select {...p} options={SPECIALTIES} value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value as VendorSpecialty })} />}</Field>
        <Field label="Regional hub">{(p) => <Select {...p} options={HUBS} value={f.hub} onChange={(e) => setF({ ...f, hub: e.target.value as Hub })} />}</Field>
        <Field label="Key contact" error={errors.contact}>{(p) => <Input {...p} value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} />}</Field>
        <Field label="Phone">{(p) => <Input {...p} type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}</Field>
        <Field label="Email" error={errors.email}>{(p) => <Input {...p} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
        <Field label="GSTIN number" error={errors.gstin}>{(p) => <Input {...p} className="font-mono uppercase" placeholder="33AAJFP4821K1Z7" value={f.gstin} onChange={(e) => setF({ ...f, gstin: e.target.value })} />}</Field>
        <Field label="Payment terms">{(p) => <Select {...p} options={PAYMENT_TERMS} value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value as PaymentTerms })} />}</Field>
        <Field label="Performance rating">{(p) => <Select {...p} options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? 's' : ''}` }))} value={String(f.rating)} onChange={(e) => setF({ ...f, rating: Number(e.target.value) })} />}</Field>
        <Field label="Initial status" className="sm:col-span-2">{(p) => <Select {...p} options={VENDOR_STATUSES} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as VendorStatus })} />}</Field>
        <button type="submit" className="hidden" />
      </form>
      <Meta className="mt-4 block" items={['Under Review vendors do not count toward the active network']} />
    </Dialog>
  );
}
