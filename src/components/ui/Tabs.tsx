import { cn } from '@/lib/cn';

interface Option<T extends string> { value: T; label: string; count?: number }

/** Segmented control. Capsule styling is deliberate: it is an interactive control. */
export function Segmented<T extends string>({ value, onChange, options, className, label }: { value: T; onChange: (v: T) => void; options: Option<T>[]; className?: string; label: string }) {
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-line bg-subtle p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-medium transition-colors',
              active ? 'bg-surface text-fg shadow-[0_0_0_1px_hsl(var(--line-strong))]' : 'text-fg-muted hover:text-fg',
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cn('font-mono text-2xs', active ? 'text-fg-subtle' : 'text-fg-subtle/80')}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Underline tabs for page-level sections. */
export function PageTabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Option<T>[] }) {
  return (
    <div role="tablist" className="flex gap-5 overflow-x-auto border-b border-line">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn('-mb-px inline-flex h-9 items-center gap-2 whitespace-nowrap border-b-2 text-[13px] font-medium transition-colors', active ? 'border-fg text-fg' : 'border-transparent text-fg-subtle hover:text-fg')}
          >
            {o.label}
            {o.count !== undefined && <span className="font-mono text-2xs text-fg-subtle">{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
