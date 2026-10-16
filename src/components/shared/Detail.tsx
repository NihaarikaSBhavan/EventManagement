import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Definition grid for read-only record details. */
export function DetailGrid({ items, className }: { items: { label: string; value: ReactNode; wide?: boolean }[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((it) => (
        <div key={it.label} className={cn('min-w-0', it.wide && 'sm:col-span-2 lg:col-span-3')}>
          <dt className="text-2xs font-medium uppercase tracking-wider text-fg-subtle">{it.label}</dt>
          <dd className="mt-1 text-[13px] text-fg">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="text-2xs font-medium uppercase tracking-wider text-fg-subtle">{children}</h3>
      {action}
    </div>
  );
}
