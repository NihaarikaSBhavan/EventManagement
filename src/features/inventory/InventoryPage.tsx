import { Boxes, PackagePlus, Plus, Warehouse } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Dialog } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/Feedback';
import { Field, Input, Select } from '@/components/ui/Field';
import { Progress } from '@/components/ui/Progress';
import { Stat } from '@/components/ui/Stat';
import { Meta, Status } from '@/components/ui/Status';
import { Segmented } from '@/components/ui/Tabs';
import { GatedButton } from '@/components/shared/Gate';
import { PageHeader } from '@/components/shared/PageHeader';
import { ASSET_CATEGORIES, DEPOT_SHORT, DEPOTS } from '@/domain/constants';
import { allocationByItem, available, jobsUsingItem, nextId } from '@/domain/selectors';
import { jobTone } from '@/domain/tones';
import type { AssetCategory, Depot, InventoryItem } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { formatDate } from '@/lib/dates';
import { formatINR, formatNumber, parseAmount, percent } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

export function InventoryPage() {
  const { inventory, jobs, events } = useAppStore((s) => s.data);
  const stockIn = useAppStore((s) => s.stockIn);
  const { openJob } = useEntityLinks();
  const [depot, setDepot] = useState<'All' | Depot>('All');
  const [selectedId, setSelectedId] = useState(inventory[0]?.id ?? '');
  const [registerOpen, setRegisterOpen] = useState(false);

  const allocation = useMemo(() => allocationByItem(jobs), [jobs]);
  const rows = inventory.filter((i) => depot === 'All' || i.depot === depot);
  const totals = useMemo(() => {
    const total = inventory.reduce((s, i) => s + i.total, 0);
    const allocated = inventory.reduce((s, i) => s + (allocation[i.id] ?? 0), 0);
    return {
      total, allocated, ready: total - allocated,
      base: inventory.reduce((s, i) => s + i.total * i.dailyRate, 0),
      deployed: inventory.reduce((s, i) => s + (allocation[i.id] ?? 0) * i.dailyRate, 0),
    };
  }, [inventory, allocation]);

  const selected = inventory.find((i) => i.id === selectedId) ?? inventory[0];
  const usage = selected ? jobsUsingItem(jobs, selected.id) : [];

  const columns: Column<InventoryItem>[] = [
    { id: 'asset', header: 'Asset', sortValue: (i) => i.name, cell: (i) => <div className="min-w-0"><p className="font-medium">{i.name}</p><Meta items={[<span key="i" className="font-mono">{i.id}</span>, i.spec, i.category]} /></div> },
    { id: 'depot', header: 'Depot', sortValue: (i) => i.depot, cell: (i) => <span className="text-fg-muted">{DEPOT_SHORT[i.depot]}</span> },
    { id: 'total', header: 'Total', align: 'right', sortValue: (i) => i.total, cell: (i) => <span className="tabular">{formatNumber(i.total)}</span> },
    {
      id: 'avail', header: 'Available', align: 'right', sortValue: (i) => available(i, allocation),
      cell: (i) => { const a = available(i, allocation); return <span className={`font-medium tabular ${a < i.total * 0.15 ? 'text-danger' : 'text-success'}`}>{formatNumber(a)}</span>; },
    },
    { id: 'alloc', header: 'Allocated', align: 'right', sortValue: (i) => allocation[i.id] ?? 0, cell: (i) => <span className="tabular">{formatNumber(allocation[i.id] ?? 0)}</span> },
    { id: 'rate', header: 'Rate / day', align: 'right', sortValue: (i) => i.dailyRate, cell: (i) => <span className="tabular">{formatINR(i.dailyRate)}</span> },
    {
      id: 'util', header: 'Utilization', width: '150px', sortValue: (i) => percent(allocation[i.id] ?? 0, i.total),
      cell: (i) => { const u = percent(allocation[i.id] ?? 0, i.total); return <div className="flex items-center gap-2"><Progress value={u} className="flex-1" label={`${u}% deployed`} /><span className="w-10 text-right font-mono text-xs text-fg-muted">{Math.round(u)}%</span></div>; },
    },
    {
      id: 'actions', header: '', width: '120px',
      cell: (i) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <GatedButton permission="inventory.stockIn" size="sm" onClick={() => { setSelectedId(i.id); notify(stockIn(i.id)); }}><PackagePlus />+5 Stock in</GatedButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Equipment inventory & depots"
        description="Staging assets across Ambattur, Peenya, Sanathnagar and Kalamassery. Allocation is live from every open job order."
        actions={<GatedButton permission="inventory.register" variant="primary" onClick={() => setRegisterOpen(true)}><Plus />Register equipment</GatedButton>}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total stock" icon={Boxes} value={formatNumber(totals.total)} footnote={`units across ${inventory.length} asset lines`} />
        <Stat label="Available stock" tone="success" value={formatNumber(totals.ready)} footnote="ready to dispatch" />
        <Stat label="Allocated stock" value={formatNumber(totals.allocated)} footnote="deployed on active job orders" />
        <Stat label="Daily rental base" icon={Warehouse} value={formatINR(totals.base)} footnote={`${formatINR(totals.deployed)}/day currently deployed`} />
      </section>

      <Segmented label="Depot" value={depot} onChange={setDepot} options={[{ value: 'All' as const, label: 'All depots' }, ...DEPOTS.map((d) => ({ value: d, label: DEPOT_SHORT[d], count: inventory.filter((i) => i.depot === d).length }))]} />

      <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[1fr_380px]">
        <Card>
          <DataTable rows={rows} columns={columns} rowKey={(i) => i.id} onRowClick={(i) => setSelectedId(i.id)} selectedKey={selected?.id} minWidth={1040}
            empty={<EmptyState icon={Boxes} title="No assets at this depot" />} />
        </Card>

        {selected && (
          <Card className="self-start">
            <CardHeader title="Active deployed job tracker" description="Click any asset row to inspect it" />
            <div className="flex flex-col gap-4 p-4">
              <div>
                <p className="text-sm font-semibold">{selected.name}</p>
                <Meta items={[<span key="i" className="font-mono">{selected.id}</span>, selected.depot]} />
              </div>
              <dl className="grid grid-cols-3 gap-3">
                {[['Total', selected.total, ''], ['Deployed', allocation[selected.id] ?? 0, 'text-primary'], ['Ready', available(selected, allocation), 'text-success']].map(([l, v, c]) => (
                  <div key={l as string} className="rounded-lg border border-line p-2.5"><dt className="text-2xs uppercase tracking-wider text-fg-subtle">{l}</dt><dd className={`mt-1 text-lg font-semibold tabular ${c}`}>{formatNumber(v as number)}</dd></div>
                ))}
              </dl>
              {usage.length ? (
                <ul className="divide-y divide-line/70 rounded-lg border border-line">
                  {usage.map(({ job, qty }) => (
                    <li key={job.no}>
                      <button type="button" onClick={() => openJob(job.no)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-subtle">
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs font-medium">{job.no}</p>
                          <p className="truncate text-xs text-fg-subtle">{events.find((e) => e.code === job.eventCode)?.title}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[13px] font-semibold tabular">{formatNumber(qty)}</p>
                          <Status tone={jobTone[job.stage]}>{job.stage}</Status>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-xs text-fg-subtle">Not deployed on any active job order — full stock is at the depot.</p>
              )}
              {usage.length > 0 && <p className="text-2xs text-fg-subtle">Earliest due {formatDate(usage.map((u) => u.job.due).sort()[0])}. Gear returns to the depot when its job order completes.</p>}
            </div>
          </Card>
        )}
      </div>

      <RegisterEquipmentDialog open={registerOpen} onOpenChange={setRegisterOpen} onCreated={setSelectedId} />
    </>
  );
}

function RegisterEquipmentDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  const register = useAppStore((s) => s.registerItem);
  const inventory = useAppStore((s) => s.data.inventory);
  const [f, setF] = useState({ name: '', spec: '', category: 'LED & Visuals' as AssetCategory, depot: DEPOTS[0] as Depot, total: '', rate: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const total = Math.floor(parseAmount(f.total));
    const rate = parseAmount(f.rate);
    const e: Record<string, string> = {};
    if (!f.name.trim()) e.name = 'Required';
    if (!(total > 0)) e.total = 'Enter units above 0';
    if (!(rate > 0)) e.rate = 'Enter a daily rate above ₹0';
    setErrors(e);
    if (Object.keys(e).length) return;
    const id = nextId(inventory, (i) => i.id, 'INV-', 2);
    if (notify(register({ name: f.name.trim(), spec: f.spec.trim() || '—', category: f.category, depot: f.depot, total, dailyRate: rate }))) {
      onCreated(id);
      setF({ name: '', spec: '', category: 'LED & Visuals', depot: DEPOTS[0], total: '', rate: '' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} size="md" title="Register equipment" description="Adds a new asset line to a warehouse depot"
      footer={<><Button onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Register</Button></>}>
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="Equipment name" error={errors.name} className="sm:col-span-2">{(p) => <Input {...p} autoFocus placeholder="e.g. Robe MegaPointe Moving Head" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
        <Field label="Specification" className="sm:col-span-2">{(p) => <Input {...p} placeholder="e.g. 470 W beam/spot" value={f.spec} onChange={(e) => setF({ ...f, spec: e.target.value })} />}</Field>
        <Field label="Category">{(p) => <Select {...p} options={ASSET_CATEGORIES} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as AssetCategory })} />}</Field>
        <Field label="Warehouse depot">{(p) => <Select {...p} options={DEPOTS} value={f.depot} onChange={(e) => setF({ ...f, depot: e.target.value as Depot })} />}</Field>
        <Field label="Total stock (units)" error={errors.total}>{(p) => <Input {...p} inputMode="numeric" value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} />}</Field>
        <Field label="Daily rental base (₹/day)" error={errors.rate} hint={parseAmount(f.rate) > 0 ? formatINR(parseAmount(f.rate)) : undefined}>{(p) => <Input {...p} inputMode="numeric" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} />}</Field>
        <button type="submit" className="hidden" />
      </form>
    </Dialog>
  );
}
