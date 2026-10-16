import * as RD from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { usePersona } from '@/hooks/usePermission';
import { JobDetailDialog } from '@/features/jobs/JobDetailDialog';
import { CommandMenu } from './CommandMenu';
import { navFor } from './nav';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const location = useLocation();
  const persona = usePersona();
  const current = navFor(location.pathname);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.title = `${current.label} · Event Management System`;
  }, [current.label]);

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>
      <TopBar
        crumbs={[{ label: 'South India Operations' }, { label: current.group }, { label: current.label }]}
        onMenu={() => setMenuOpen(true)}
        onSearch={() => setCmdOpen(true)}
        theme={theme}
        onToggleTheme={toggle}
      />
      <div className="flex flex-1">
        <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-[256px] shrink-0 border-r border-line bg-subtle md:block">
          <Sidebar />
        </aside>
        <RD.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <RD.Portal>
            <RD.Overlay className="fixed inset-0 z-40 bg-black/40 md:hidden" />
            <RD.Content className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-line bg-subtle md:hidden focus:outline-none">
              <RD.Title className="sr-only">Navigation</RD.Title>
              <RD.Description className="sr-only">Modules and role switcher</RD.Description>
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </RD.Content>
          </RD.Portal>
        </RD.Root>
        <main id="main" className="min-w-0 flex-1">
          <div key={persona.id} className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandMenu open={cmdOpen} onOpenChange={setCmdOpen} />
      <JobDetailDialog />
    </div>
  );
}
