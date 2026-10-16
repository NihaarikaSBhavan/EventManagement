import { AlertOctagon, CheckCircle2, CircleAlert, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { activeReadiness, eventReadiness, type Level } from '@/domain/readiness';
import { TODAY } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/useAppStore';

export const LEVEL_TEXT: Record<Level, string> = { ready: 'Ready', attention: 'Needs attention', blocked: 'Blocked' };
const ICON: Record<Level, LucideIcon> = { ready: CheckCircle2, attention: CircleAlert, blocked: AlertOctagon };
const COLOR: Record<Level, string> = { ready: 'text-success', attention: 'text-warning', blocked: 'text-danger' };
const SOFT: Record<Level, string> = { ready: 'bg-success-soft', attention: 'bg-warning-soft', blocked: 'bg-danger-soft' };

/** Icon + colour + word, so state never relies on colour alone. */
export function LevelIcon({ level, className }: { level: Level; className?: string }) {
  const Icon = ICON[level];
  return <Icon aria-label={LEVEL_TEXT[level]} className={cn('size-4 shrink-0', COLOR[level], className)} />;
}

export function LevelLabel({ level, className }: { level: Level; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold', COLOR[level], className)}>
      <LevelIcon level={level} className="size-3.5" />
      {LEVEL_TEXT[level]}
    </span>
  );
}

export const levelSoft = (l: Level) => SOFT[l];
export const levelColor = (l: Level) => COLOR[l];

export function useActiveReadiness() {
  const data = useAppStore((s) => s.data);
  return useMemo(() => activeReadiness(data, TODAY), [data]);
}

export function useEventReadiness(code: string | undefined) {
  const data = useAppStore((s) => s.data);
  return useMemo(() => {
    const event = data.events.find((e) => e.code === code);
    return event ? eventReadiness(data, event, TODAY) : null;
  }, [data, code]);
}
