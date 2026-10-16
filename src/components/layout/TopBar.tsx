import { ChevronRight, Menu, Moon, Search, Sun } from 'lucide-react';
import { Fragment } from 'react';
import { Kbd } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { usePersona } from '@/hooks/usePermission';

export interface Crumb { label: string }

/** Three zones: brand wordmark · contextual breadcrumb · role & currency indicator. */
export function TopBar({ crumbs, onMenu, onSearch, theme, onToggleTheme }: { crumbs: Crumb[]; onMenu: () => void; onSearch: () => void; theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const persona = usePersona();
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-line bg-surface/90 px-3 backdrop-blur supports-[backdrop-filter]:bg-surface/75 md:px-4">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Open navigation"><Menu /></Button>

      <div className="flex shrink-0 items-center gap-2 md:w-[232px]">
        <svg aria-hidden viewBox="0 0 32 32" className="size-6 shrink-0"><rect width="32" height="32" rx="8" className="fill-primary" /><path d="M10 10h12M10 16h9M10 22h12" stroke="white" strokeWidth="2.6" strokeLinecap="round" /></svg>
        <span className="hidden text-[13px] font-semibold tracking-tight text-fg sm:inline">Event Management System</span>
      </div>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1 text-[13px] lg:flex">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0 text-line-strong" />}
            <span className={i === crumbs.length - 1 ? 'truncate font-medium text-fg' : 'truncate text-fg-subtle'} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>
          </Fragment>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <button type="button" onClick={onSearch} className="hidden h-8 items-center gap-2 rounded-md border border-line bg-subtle pl-2.5 pr-1.5 text-xs text-fg-subtle hover:border-line-strong hover:text-fg sm:flex">
          <Search className="size-3.5" /> Search or jump to… <Kbd>⌘K</Kbd>
        </button>
        <Button variant="ghost" size="icon" className="sm:hidden" onClick={onSearch} aria-label="Search"><Search /></Button>
        <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
        <div className="ml-1 hidden items-center gap-2 border-l border-line pl-3 text-xs md:flex">
          <span className="font-mono font-medium text-fg">{persona.role}</span>
          <span aria-hidden className="text-line-strong">·</span>
          <span className="font-mono font-medium text-success">₹ INR</span>
          <span className="text-fg-subtle">en-IN</span>
        </div>
      </div>
    </header>
  );
}
