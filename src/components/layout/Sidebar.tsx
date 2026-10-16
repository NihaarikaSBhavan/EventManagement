import { NavLink } from 'react-router-dom';
import { ChevronsUpDown, RotateCcw } from 'lucide-react';
import { PERSONAS, ROLE_SCOPE } from '@/domain/rbac';
import { notify } from '@/hooks/useAction';
import { usePersona } from '@/hooks/usePermission';
import { cn } from '@/lib/cn';
import { useAppStore } from '@/store/useAppStore';
import { NAV, NAV_GROUPS } from './nav';

function initials(name: string) {
  return name.replace(/^[A-Z]\.\s*/, '').split(' ').map((p) => p[0]).slice(0, 2).join('');
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const persona = usePersona();
  const setPersona = useAppStore((s) => s.setPersona);
  const reset = useAppStore((s) => s.resetDemo);

  return (
    <div className="flex h-full flex-col gap-4 px-3 py-3">
      <div className="rounded-lg border border-line bg-surface p-2">
        <label htmlFor="persona" className="px-1 text-2xs font-medium uppercase tracking-wider text-fg-subtle">Acting as</label>
        <div className="relative mt-1.5">
          <div className="pointer-events-none flex items-center gap-2.5 rounded-md px-1 py-1">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-xs font-semibold text-primary">{initials(persona.name)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-fg">{persona.name}</span>
              <span className="block truncate font-mono text-2xs text-fg-subtle">{persona.role}</span>
            </span>
            <ChevronsUpDown className="size-3.5 text-fg-subtle" />
          </div>
          <select
            id="persona"
            aria-label="Switch role"
            value={persona.id}
            onChange={(e) => notify(setPersona(e.target.value))}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}
          </select>
        </div>
        <p className="mt-2 px-1 text-xs leading-4 text-fg-subtle">{ROLE_SCOPE[persona.role]}</p>
      </div>

      <nav aria-label="Modules" className="flex flex-1 flex-col gap-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            <p className="px-2 pb-1 text-2xs font-medium uppercase tracking-wider text-fg-subtle">{group}</p>
            <ul className="flex flex-col gap-px">
              {NAV.filter((n) => n.group === group).map(({ path, label, icon: Icon }) => (
                <li key={path}>
                  <NavLink
                    to={path}
                    end={path === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn('flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors', isActive ? 'bg-surface text-fg shadow-[0_0_0_1px_hsl(var(--line))]' : 'text-fg-muted hover:bg-muted hover:text-fg')
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <button type="button" onClick={() => notify(reset())} className="flex h-8 items-center gap-2 rounded-md px-2 text-xs text-fg-subtle hover:bg-muted hover:text-fg">
        <RotateCcw className="size-3.5" /> Reset demo data
      </button>
    </div>
  );
}
