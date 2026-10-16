import { ArrowRightLeft, LayoutGrid, Mail, MapPin, Pencil, Phone, Plus, Rows3, Search, SearchX, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/Feedback';
import { Input, Select } from '@/components/ui/Field';
import { Meta, Priority } from '@/components/ui/Status';
import { Segmented } from '@/components/ui/Tabs';
import { Tooltip } from '@/components/ui/Tooltip';
import { GatedButton } from '@/components/shared/Gate';
import { PageHeader } from '@/components/shared/PageHeader';
import { CITY_STATE, LEAD_PRIORITIES, LEAD_STAGES } from '@/domain/constants';
import { leadPriorityTone } from '@/domain/tones';
import type { Lead, LeadPriority, LeadStage } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { useCan, usePersona } from '@/hooks/usePermission';
import { formatINR, parseAmount } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { LeadFormDialog } from './LeadFormDialog';

type StageFilter = 'All' | LeadStage;
type PriorityFilter = 'All' | LeadPriority;

export function LeadsPage() {
  const leads = useAppStore((s) => s.data.leads);
  const inventory = useAppStore((s) => s.data.inventory);
  const setStage = useAppStore((s) => s.setLeadStage);
  const convert = useAppStore((s) => s.convertLead);
  const saveLead = useAppStore((s) => s.saveLead);
  const persona = usePersona();
  const seeAll = useCan('lead.viewAll');
  const canConvert = useCan('lead.convert');
  const { openEvent } = useEntityLinks();
  const [params, setParams] = useSearchParams();

  const query = params.get('q') ?? '';
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [stage, setStageFilter] = useState<StageFilter>('All');
  const [priority, setPriority] = useState<PriorityFilter>('All');
  const [editing, setEditing] = useState<Lead | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [quick, setQuick] = useState({ organization: '', contact: '', product: '', city: '', value: '' });

  const setQuery = (q: string) => setParams((p) => { const n = new URLSearchParams(p); if (q) n.set('q', q); else n.delete('q'); return n; }, { replace: true });

  const visible = useMemo(() => leads.filter((l) => seeAll || l.executive === persona.name), [leads, seeAll, persona.name]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((l) =>
      (stage === 'All' || l.stage === stage) &&
      (priority === 'All' || l.priority === priority) &&
      (!q || [l.organization, l.contact, l.product, l.city].some((x) => x.toLowerCase().includes(q))));
  }, [visible, stage, priority, query]);

  const gearText = (l: Lead) => Object.entries(l.gear).map(([id, q]) => `${q}× ${inventory.find((i) => i.id === id)?.shortName ?? id}`).join(' · ');
  const openForm = (l: Lead | null) => { setEditing(l); setFormOpen(true); };

  const quickAdd = () => {
    const value = parseAmount(quick.value);
    if (!quick.organization.trim() || !quick.contact.trim() || !(value > 0)) {
      notify({ ok: false, message: 'Quick add needs an organization, a contact and a deal value' });
      return;
    }
    const city = quick.city.trim() || 'Chennai';
    if (notify(saveLead({
      organization: quick.organization.trim(), contact: quick.contact.trim(), email: '', phone: '', address: '', city, state: CITY_STATE[city] ?? 'Tamil Nadu',
      product: quick.product.trim() || 'Event production', value, kits: '', gear: {}, executive: persona.role === 'EXECUTIVE' ? persona.name : 'Keerthana Murali',
      priority: 'Medium', stage: 'New Inbound', notes: '',
    }))) {
      setQuick({ organization: '', contact: '', product: '', city: '', value: '' });
      setStageFilter('All');
    }
  };

  const convertAction = (lead: Lead, compact = false) => {
    if (lead.convertedTo) return <Button size="sm" variant="link" onClick={() => openEvent(lead.convertedTo!)}>{compact ? lead.convertedTo : `Converted → ${lead.convertedTo}`}</Button>;
    if (lead.stage !== 'Closed Won') return null;
    return (
      <GatedButton permission="lead.convert" size="sm" variant="success" onClick={() => notify(convert(lead.id))}>
        <ArrowRightLeft />{compact ? 'Convert' : 'Convert to event'}
      </GatedButton>
    );
  };

  const stageSelect = (lead: Lead) => (
    <Select aria-label={`Stage for ${lead.organization}`} className="w-40" value={lead.stage} options={LEAD_STAGES} onChange={(e) => notify(setStage(lead.id, e.target.value as LeadStage))} />
  );

  const columns: Column<Lead>[] = [
    { id: 'org', header: 'Organization', sortValue: (l) => l.organization, cell: (l) => <div><p className="font-medium">{l.organization}</p><p className="font-mono text-2xs text-fg-subtle">{l.id}</p></div> },
    { id: 'contact', header: 'Contact person', sortValue: (l) => l.contact, cell: (l) => l.contact },
    { id: 'phone', header: 'Phone', cell: (l) => <span className="font-mono text-xs">{l.phone || '—'}</span> },
    { id: 'email', header: 'Email', cell: (l) => <span className="text-fg-muted">{l.email || '—'}</span> },
    { id: 'loc', header: 'Location', sortValue: (l) => l.city, cell: (l) => `${l.city}, ${l.state}` },
    { id: 'product', header: 'Requested product', cell: (l) => l.product },
    { id: 'kit', header: 'Inventory kit', cell: (l) => <span className="text-xs text-fg-muted">{l.kits || '—'}</span> },
    { id: 'value', header: 'Deal value', align: 'right', sortValue: (l) => l.value, cell: (l) => <span className="font-medium tabular">{formatINR(l.value)}</span> },
    { id: 'prio', header: 'Priority', sortValue: (l) => LEAD_PRIORITIES.indexOf(l.priority), cell: (l) => <Priority tone={leadPriorityTone[l.priority]}>{l.priority}</Priority> },
    { id: 'stage', header: 'Stage', sortValue: (l) => LEAD_STAGES.indexOf(l.stage), cell: (l) => stageSelect(l) },
    {
      id: 'actions', header: '', width: '180px',
      cell: (l) => (
        <div className="flex items-center justify-end gap-1">
          {convertAction(l, true)}
          <Tooltip content="Edit dossier"><Button size="icon-sm" variant="ghost" aria-label={`Edit ${l.organization}`} onClick={() => openForm(l)}><Pencil /></Button></Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="CRM & active leads"
        description={seeAll ? 'Customer pipeline across South India — dossiers, filters and one-click conversion into production.' : `Dossiers assigned to ${persona.name}. The full pipeline is visible to TEAM_LEAD and above.`}
        actions={<Button variant="primary" onClick={() => openForm(null)}><Plus />New lead dossier</Button>}
      />

      <Card className="flex flex-col gap-3 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-subtle" />
            <Input aria-label="Search leads" type="search" placeholder="Search company, contact, product or city" className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Segmented label="Priority" value={priority} onChange={setPriority} options={(['All', ...LEAD_PRIORITIES] as PriorityFilter[]).map((p) => ({ value: p, label: p }))} />
          <div className="inline-flex rounded-lg border border-line bg-subtle p-0.5" role="tablist" aria-label="View">
            {([['cards', LayoutGrid, 'Card view'], ['table', Rows3, 'List view']] as const).map(([v, Icon, label]) => (
              <Tooltip key={v} content={label}>
                <button type="button" role="tab" aria-selected={view === v} aria-label={label} onClick={() => setView(v)} className={`grid h-7 w-8 place-items-center rounded-md ${view === v ? 'bg-surface text-fg shadow-[0_0_0_1px_hsl(var(--line-strong))]' : 'text-fg-subtle hover:text-fg'}`}><Icon className="size-3.5" /></button>
              </Tooltip>
            ))}
          </div>
        </div>
        <Segmented label="Stage" value={stage} onChange={setStageFilter}
          options={(['All', ...LEAD_STAGES] as StageFilter[]).map((s) => ({ value: s, label: s, count: visible.filter((l) => s === 'All' || l.stage === s).length }))} />
      </Card>

      <Card className="p-3">
        <p className="mb-2 px-1 text-2xs font-medium uppercase tracking-wider text-fg-subtle">Quick add · inline dossier</p>
        <form className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_1.2fr_1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); quickAdd(); }}>
          <Input aria-label="Organization" placeholder="Organization" value={quick.organization} onChange={(e) => setQuick({ ...quick, organization: e.target.value })} />
          <Input aria-label="Contact person" placeholder="Contact person" value={quick.contact} onChange={(e) => setQuick({ ...quick, contact: e.target.value })} />
          <Input aria-label="Requested product" placeholder="Requested product" value={quick.product} onChange={(e) => setQuick({ ...quick, product: e.target.value })} />
          <Input aria-label="City" placeholder="City" value={quick.city} onChange={(e) => setQuick({ ...quick, city: e.target.value })} />
          <Input aria-label="Deal value in rupees" placeholder="Deal value ₹" inputMode="numeric" className="tabular" value={quick.value} onChange={(e) => setQuick({ ...quick, value: e.target.value })} />
          <Button type="submit"><Plus />Add</Button>
        </form>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-fg-subtle"><span className="font-medium text-fg">{filtered.length}</span> of {visible.length} leads · <span className="tabular">{formatINR(filtered.reduce((s, l) => s + l.value, 0))}</span> in view</p>
        {(query || stage !== 'All' || priority !== 'All') && (
          <Button size="sm" variant="ghost" onClick={() => { setQuery(''); setStageFilter('All'); setPriority('All'); }}><X />Clear filters</Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={SearchX} title="No leads match these filters" description="Clear the search or pick another stage or priority." action={<Button onClick={() => { setQuery(''); setStageFilter('All'); setPriority('All'); }}>Clear filters</Button>} /></Card>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {filtered.map((l) => (
            <Card key={l.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3 p-4 pb-0">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{l.organization}</h3>
                  <Meta className="mt-0.5 block" items={[<span key="i" className="font-mono">{l.id}</span>, l.executive]} />
                </div>
                <Priority tone={leadPriorityTone[l.priority]}>{l.priority}</Priority>
              </div>
              <div className="px-4 pt-3">
                <p className="text-xl font-semibold tracking-tight tabular">{formatINR(l.value)}</p>
                <p className="mt-0.5 text-[13px] text-fg-muted">{l.product}</p>
              </div>
              <dl className="flex flex-col gap-2 px-4 pt-3 text-xs">
                <div className="flex gap-2"><dt className="w-16 shrink-0 text-fg-subtle">Kit</dt><dd className="text-fg-muted">{l.kits || '—'}{gearText(l) && <span className="mt-0.5 block font-mono text-2xs text-fg-subtle">{gearText(l)}</span>}</dd></div>
                <div className="flex gap-2"><dt className="w-16 shrink-0 text-fg-subtle">Contact</dt><dd className="min-w-0 text-fg-muted">
                  <span className="text-fg">{l.contact}</span>
                  <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {l.phone && <a className="inline-flex items-center gap-1 hover:text-primary" href={`tel:${l.phone.replace(/\s/g, '')}`}><Phone className="size-3" />{l.phone}</a>}
                    {l.email && <a className="inline-flex min-w-0 items-center gap-1 truncate hover:text-primary" href={`mailto:${l.email}`}><Mail className="size-3 shrink-0" />{l.email}</a>}
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{l.city}, {l.state}</span>
                  </span>
                </dd></div>
              </dl>
              {l.notes && <p className="mx-4 mt-3 line-clamp-2 border-l-0 text-xs leading-5 text-fg-subtle">{l.notes}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line p-3 pt-3 [margin-top:auto]">
                {stageSelect(l)}
                <Button size="sm" variant="ghost" onClick={() => openForm(l)}><Pencil />Edit</Button>
                <div className="ml-auto">{convertAction(l)}</div>
              </div>
              {l.stage === 'Closed Won' && !l.convertedTo && !canConvert && <p className="px-3 pb-3 text-2xs text-fg-subtle">Won — a MANAGER converts this into production.</p>}
            </Card>
          ))}
        </div>
      ) : (
        <Card><DataTable rows={filtered} columns={columns} rowKey={(l) => l.id} minWidth={1780} /></Card>
      )}

      <LeadFormDialog lead={editing} open={formOpen} onOpenChange={setFormOpen} />
    </>
  );
}
