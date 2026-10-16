import { Command } from 'cmdk';
import * as RD from '@radix-ui/react-dialog';
import { CalendarDays, ClipboardList, UserRound, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PERSONAS } from '@/domain/rbac';
import { notify } from '@/hooks/useAction';
import { useAppStore } from '@/store/useAppStore';
import { NAV } from './nav';

const item = 'flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[13px] text-fg-muted aria-selected:bg-muted aria-selected:text-fg';
const group = '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-fg-subtle';

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const data = useAppStore((s) => s.data);
  const setPersona = useAppStore((s) => s.setPersona);
  const run = (fn: () => void) => { onOpenChange(false); fn(); };

  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-fade-in" />
        <RD.Content className="fixed left-1/2 top-[14vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-surface shadow-overlay focus:outline-none">
          <RD.Title className="sr-only">Command menu</RD.Title>
          <RD.Description className="sr-only">Jump to a module, event, job order or lead, or switch role.</RD.Description>
          <Command label="Command menu" loop>
            <Command.Input autoFocus placeholder="Search modules, events, job orders, leads…" className="h-12 w-full border-b border-line bg-transparent px-4 text-sm text-fg placeholder:text-fg-subtle focus:outline-none" />
            <Command.List className="max-h-[360px] overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-8 text-center text-xs text-fg-subtle">No matches.</Command.Empty>
              <Command.Group heading="Modules" className={group}>
                {NAV.map(({ path, label, icon: Icon }) => (
                  <Command.Item key={path} value={`module ${label}`} onSelect={() => run(() => navigate(path))} className={item}><Icon className="size-4" />{label}</Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Events" className={group}>
                {data.events.map((e) => (
                  <Command.Item key={e.code} value={`${e.code} ${e.title} ${e.client} ${e.venue}`} onSelect={() => run(() => navigate(`/events/${e.code}`))} className={item}>
                    <CalendarDays className="size-4" /><span className="truncate">{e.title}</span><span className="ml-auto font-mono text-2xs text-fg-subtle">{e.code}</span>
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Job orders" className={group}>
                {data.jobs.map((j) => (
                  <Command.Item key={j.no} value={`${j.no} ${j.title}`} onSelect={() => run(() => navigate(`/jobs?job=${j.no}`))} className={item}>
                    <ClipboardList className="size-4" /><span className="truncate">{j.title}</span><span className="ml-auto font-mono text-2xs text-fg-subtle">{j.no}</span>
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Leads" className={group}>
                {data.leads.map((l) => (
                  <Command.Item key={l.id} value={`${l.id} ${l.organization} ${l.contact} ${l.city}`} onSelect={() => run(() => navigate(`/leads?q=${encodeURIComponent(l.organization)}`))} className={item}>
                    <Users className="size-4" /><span className="truncate">{l.organization}</span><span className="ml-auto text-2xs text-fg-subtle">{l.stage}</span>
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Switch role" className={group}>
                {PERSONAS.map((p) => (
                  <Command.Item key={p.id} value={`role ${p.name} ${p.role}`} onSelect={() => run(() => notify(setPersona(p.id)))} className={item}>
                    <UserRound className="size-4" />{p.name}<span className="ml-auto font-mono text-2xs text-fg-subtle">{p.role}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
