import { DEPOT_SHORT } from '@/domain/constants';
import { allocationByItem, available } from '@/domain/selectors';
import type { GearRequest } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

/** Quantity picker over live warehouse availability. */
export function GearPicker({ value, onChange }: { value: GearRequest; onChange: (v: GearRequest) => void }) {
  const inventory = useAppStore((s) => s.data.inventory);
  const jobs = useAppStore((s) => s.data.jobs);
  const allocation = allocationByItem(jobs);
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="grid grid-cols-[1fr_96px_72px_88px] gap-3 bg-subtle px-3 py-2 text-2xs font-medium uppercase tracking-wider text-fg-subtle">
        <span>Asset</span><span>Depot</span><span className="text-right">Ready</span><span>Qty</span>
      </div>
      <ul className="max-h-64 divide-y divide-line/70 overflow-y-auto">
        {inventory.map((item) => {
          const ready = available(item, allocation);
          const qty = value[item.id] ?? 0;
          const over = qty > ready;
          return (
            <li key={item.id} className="grid grid-cols-[1fr_96px_72px_88px] items-center gap-3 px-3 py-1.5 text-[13px]">
              <span className="truncate">{item.name}</span>
              <span className="text-xs text-fg-subtle">{DEPOT_SHORT[item.depot]}</span>
              <span className="text-right font-mono text-xs">{formatNumber(ready)}</span>
              <input
                aria-label={`Quantity of ${item.name}`}
                inputMode="numeric"
                value={qty || ''}
                placeholder="0"
                onChange={(e) => {
                  const n = Math.max(0, Math.floor(Number(e.target.value.replace(/\D/g, '')) || 0));
                  const next = { ...value };
                  if (n) next[item.id] = n; else delete next[item.id];
                  onChange(next);
                }}
                className={cn('h-7 w-full rounded-md border bg-surface px-2 text-right font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/20', over ? 'border-warning text-warning' : 'border-line-strong')}
              />
            </li>
          );
        })}
      </ul>
      <p className="border-t border-line bg-subtle/60 px-3 py-1.5 text-2xs text-fg-subtle">Quantities above ready stock reserve partially and are flagged.</p>
    </div>
  );
}

/** Radio list of productions that can still take work. */
export function EventPicker({ value, onChange, name }: { value: string; onChange: (code: string) => void; name: string }) {
  const events = useAppStore((s) => s.data.events).filter((e) => e.status !== 'Completed');
  return (
    <div role="radiogroup" className="max-h-48 divide-y divide-line/70 overflow-y-auto rounded-lg border border-line">
      {events.map((e) => (
        <label key={e.code} className={cn('flex cursor-pointer items-center gap-3 px-3 py-2 text-[13px] hover:bg-subtle', value === e.code && 'bg-primary-soft/60 hover:bg-primary-soft/60')}>
          <input type="radio" name={name} checked={value === e.code} onChange={() => onChange(e.code)} className="accent-[hsl(var(--primary))]" />
          <span className="font-mono text-xs text-fg-subtle">{e.code}</span>
          <span className="truncate">{e.title}</span>
          <span className="ml-auto hidden truncate text-xs text-fg-subtle sm:inline">{e.client}</span>
        </label>
      ))}
    </div>
  );
}
