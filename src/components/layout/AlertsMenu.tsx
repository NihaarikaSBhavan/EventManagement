import * as DM from '@radix-ui/react-dropdown-menu';
import { Bell } from 'lucide-react';
import { useMemo } from 'react';
import { needsAttention } from '@/domain/readiness';
import { useEntityLinks } from '@/hooks/useEntityLinks';
import { useActiveReadiness, LevelIcon } from '@/components/shared/Readiness';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';

/** Red blockers on any event, plus anything still open on events loading in within 3 days. */
export function AlertsMenu() {
  const active = useActiveReadiness();
  const read = useAppStore((s) => s.readAlerts);
  const markRead = useAppStore((s) => s.markAlertsRead);
  const { openEvent, openJob } = useEntityLinks();

  const alerts = useMemo(() => needsAttention(active).filter((b) => b.level === 'blocked' || b.daysToLoadIn <= 3), [active]);
  const unread = alerts.filter((a) => !read.includes(a.id));

  return (
    <DM.Root>
      <DM.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label={unread.length ? `${unread.length} new alerts` : 'Alerts'} className="relative">
          <Bell />
          {unread.length > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white dark:text-canvas">{unread.length}</span>}
        </Button>
      </DM.Trigger>
      <DM.Portal>
        <DM.Content align="end" sideOffset={8} className="z-50 w-[min(92vw,400px)] overflow-hidden rounded-xl border border-line bg-surface shadow-overlay data-[state=open]:animate-fade-in">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Alerts</p>
            <button type="button" disabled={!unread.length} onClick={() => markRead(alerts.map((a) => a.id))} className="text-xs font-medium text-primary hover:underline disabled:text-fg-subtle disabled:no-underline">Mark all read</button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {alerts.length === 0 && <p className="px-4 py-8 text-center text-xs text-fg-subtle">You're all caught up.</p>}
            {alerts.map((a) => {
              const isUnread = !read.includes(a.id);
              return (
                <DM.Item
                  key={a.id}
                  onSelect={() => { markRead([a.id]); if (a.fix.kind === 'job') openJob(a.fix.no); else openEvent(a.eventCode, a.fix.tab); }}
                  className="flex cursor-pointer items-start gap-3 border-b border-line/70 px-4 py-3 outline-none last:border-0 data-[highlighted]:bg-subtle"
                >
                  <LevelIcon level={a.level} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] ${isUnread ? 'font-semibold text-fg' : 'text-fg-muted'}`}>{a.title}</p>
                    <p className="mt-0.5 truncate text-xs text-fg-subtle">{a.event.title} · {a.owner}</p>
                  </div>
                  {isUnread && <span aria-label="Unread" className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                </DM.Item>
              );
            })}
          </div>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}
