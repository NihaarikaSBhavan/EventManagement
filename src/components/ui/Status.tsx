import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const dot: Record<Tone, string> = {
  neutral: 'bg-fg-subtle',
  info: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};
const text: Record<Tone, string> = {
  neutral: 'text-fg-muted',
  info: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

/** Zero-pill status: a dot and a word, never a capsule. Capsules are reserved for controls. */
export function Status({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium', text[tone], className)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', dot[tone])} />
      {children}
    </span>
  );
}

/** Uppercase priority marker with a square glyph — reads as metadata, not a button. */
export function Priority({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-2xs font-semibold uppercase tracking-wider', text[tone])}>
      <span aria-hidden className={cn('size-1.5 rounded-[1px]', dot[tone])} />
      {children}
    </span>
  );
}

/** Metadata run separated by typographic bullets. */
export function Meta({ items, className }: { items: ReactNode[]; className?: string }) {
  const parts = items.filter((x) => x !== null && x !== undefined && x !== false && x !== '');
  return (
    <span className={cn('text-xs text-fg-subtle', className)}>
      {parts.map((item, i) => (
        <span key={i}>
          {i > 0 && <span aria-hidden className="mx-1.5 text-line-strong">·</span>}
          {item}
        </span>
      ))}
    </span>
  );
}
