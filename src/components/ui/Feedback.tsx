import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function EmptyState({ icon: Icon, title, description, action, className }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 px-6 py-12 text-center', className)}>
      <div className="mb-1 grid size-10 place-items-center rounded-lg border border-line bg-subtle text-fg-subtle">
        <Icon className="size-4" />
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && <p className="max-w-sm text-xs text-fg-subtle">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Callout({ tone = 'warning', icon: Icon, title, children, action }: { tone?: 'warning' | 'danger' | 'info'; icon: LucideIcon; title: ReactNode; children?: ReactNode; action?: ReactNode }) {
  const styles = {
    warning: 'border-warning/25 bg-warning-soft text-warning',
    danger: 'border-danger/25 bg-danger-soft text-danger',
    info: 'border-primary/25 bg-primary-soft text-primary',
  }[tone];
  return (
    <div className={cn('flex flex-wrap items-start gap-3 rounded-lg border px-3.5 py-3', styles)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">{title}</p>
        {children && <div className="mt-0.5 text-xs text-fg-muted">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface px-1 font-mono text-2xs font-medium text-fg-subtle">{children}</kbd>;
}
