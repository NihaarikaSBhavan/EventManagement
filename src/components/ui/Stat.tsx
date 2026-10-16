import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Card } from './Card';

interface StatProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  footnote?: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  children?: ReactNode;
  className?: string;
}

export function Stat({ label, value, icon: Icon, footnote, tone = 'default', children, className }: StatProps) {
  const valueTone = { default: 'text-fg', success: 'text-success', warning: 'text-warning', danger: 'text-danger' }[tone];
  return (
    <Card className={cn('flex flex-col gap-3 p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-fg-muted">{label}</span>
        {Icon && <Icon aria-hidden className="size-3.5 text-fg-subtle" />}
      </div>
      <div className={cn('text-[22px] font-semibold leading-none tracking-tight tabular', valueTone)}>{value}</div>
      {children}
      {footnote && <div className="text-xs text-fg-subtle">{footnote}</div>}
    </Card>
  );
}
