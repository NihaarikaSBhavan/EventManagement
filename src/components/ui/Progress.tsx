import { cn } from '@/lib/cn';

export function Progress({ value, tone = 'info', className, label }: { value: number; tone?: 'info' | 'success' | 'warning' | 'danger'; className?: string; label?: string }) {
  const color = { info: 'bg-primary', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }[tone];
  const v = Math.max(0, Math.min(100, value));
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={label} className={cn('h-1.5 overflow-hidden rounded-full bg-muted', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-300', color)} style={{ width: `${v}%` }} />
    </div>
  );
}

export interface Segment { value: number; className: string; label: string }

export function SegmentedBar({ segments, className }: { segments: Segment[]; className?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className={cn('flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full', className)} role="img" aria-label={segments.map((s) => s.label).join(', ')}>
      {segments.map((s) => (
        <div key={s.label} className={cn('h-full first:rounded-l-full last:rounded-r-full transition-[width] duration-300', s.className)} style={{ width: `${(s.value / total) * 100}%` }} />
      ))}
    </div>
  );
}
