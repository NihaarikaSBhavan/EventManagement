import { Compass } from 'lucide-react';
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, createMemoryRouter, Link, RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Feedback';
import { TooltipProvider } from '@/components/ui/Tooltip';
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

const DashboardPage = page(() => import('@/features/dashboard/DashboardPage'), 'DashboardPage');
const CalendarPage = page(() => import('@/features/events/CalendarPage'), 'CalendarPage');
const FinancePage = page(() => import('@/features/finance/FinancePage'), 'FinancePage');
const InventoryPage = page(() => import('@/features/inventory/InventoryPage'), 'InventoryPage');
const JobsPage = page(() => import('@/features/jobs/JobsPage'), 'JobsPage');
const LeadsPage = page(() => import('@/features/leads/LeadsPage'), 'LeadsPage');
const PeoplePage = page(() => import('@/features/people/PeoplePage'), 'PeoplePage');
const VendorsPage = page(() => import('@/features/vendors/VendorsPage'), 'VendorsPage');

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex animate-pulse flex-col gap-4">
      <div className="h-7 w-64 rounded-md bg-muted" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-lg bg-muted" />)}</div>
      <div className="h-80 rounded-lg bg-muted" />
    </div>
  );
}

const withSuspense = (el: ReactNode) => <Suspense fallback={<PageSkeleton />}>{el}</Suspense>;

function NotFound() {
  return (
    <Card>
      <EmptyState icon={Compass} title="Page not found" description="That module does not exist." action={<Link to="/" className="text-xs font-medium text-primary hover:underline">Go to dashboard</Link>} />
    </Card>
  );
}

/** VITE_ROUTER=memory for embedded hosts where the page URL can't carry app routes. */
const createRouter = import.meta.env.VITE_ROUTER === 'memory' ? createMemoryRouter : createBrowserRouter;

const router = createRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: withSuspense(<DashboardPage />) },
      { path: 'calendar', element: withSuspense(<CalendarPage />) },
      { path: 'leads', element: withSuspense(<LeadsPage />) },
      { path: 'jobs', element: withSuspense(<JobsPage />) },
      { path: 'inventory', element: withSuspense(<InventoryPage />) },
      { path: 'vendors', element: withSuspense(<VendorsPage />) },
      { path: 'finance', element: withSuspense(<FinancePage />) },
      { path: 'people', element: withSuspense(<PeoplePage />) },
      { path: '*', element: <NotFound /> },
    ],
  },
], {
  future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true },
});

export function App() {
  return (
    <TooltipProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
      <Toaster position="bottom-right" closeButton toastOptions={{ classNames: { toast: '!rounded-lg !border-line !bg-surface !text-fg !text-[13px] !shadow-overlay', description: '!text-fg-muted' } }} />
    </TooltipProvider>
  );
}
