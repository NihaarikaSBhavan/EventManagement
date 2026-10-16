import { ArrowRight } from 'lucide-react';
import type { Blocker } from '@/domain/readiness';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Meta } from '@/components/ui/Status';
import { LevelIcon } from './Readiness';

type Row = Blocker & { eventTitle?: string };

/** Ranked blockers, each naming an owner and opening exactly where it gets fixed. */
export function BlockerList({ items, showEvent, me, empty }: { items: Row[]; showEvent?: boolean; me?: string; empty: string }) {
  const { openEvent, openJob } = useEntityLinks();
  if (!items.length) return <p className="px-4 py-8 text-center text-xs text-fg-subtle">{empty}</p>;
  return (
    <ul className="divide-y divide-line/70">
      {items.map((b) => (
        <li key={b.id} className="flex items-start gap-3 px-4 py-3">
          <LevelIcon level={b.level} className="mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-fg">{b.title}</p>
            <Meta
              className="mt-0.5 block"
              items={[
                showEvent && b.eventTitle ? <span key="e" className="text-fg-muted">{b.eventTitle}</span> : null,
                b.detail,
                <span key="o" className={cn(me && b.owner === me && 'font-medium text-primary')}>{me && b.owner === me ? 'You' : b.owner}</span>,
              ]}
            />
          </div>
          <Button
            size="sm"
            variant={b.level === 'blocked' ? 'primary' : 'secondary'}
            className="shrink-0"
            onClick={() => (b.fix.kind === 'job' ? openJob(b.fix.no) : openEvent(b.eventCode, b.fix.tab))}
          >
            {b.fix.kind === 'job' ? 'Open order' : 'Fix'}
            <ArrowRight />
          </Button>
        </li>
      ))}
    </ul>
  );
}
