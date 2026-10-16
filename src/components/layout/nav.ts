import { Boxes, CalendarDays, ClipboardList, LayoutDashboard, ListChecks, Radio, Receipt, Truck, Users, Wallet, type LucideIcon } from 'lucide-react';

export interface NavItem { path: string; label: string; icon: LucideIcon; group: 'My work' | 'Sales' | 'Back office' }

export const NAV: NavItem[] = [
  { path: '/', label: 'My events', icon: ListChecks, group: 'My work' },
  { path: '/show-day', label: 'Show day', icon: Radio, group: 'My work' },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays, group: 'My work' },
  { path: '/leads', label: 'Leads & enquiries', icon: Users, group: 'Sales' },
  { path: '/overview', label: 'Company overview', icon: LayoutDashboard, group: 'Back office' },
  { path: '/jobs', label: 'All job orders', icon: ClipboardList, group: 'Back office' },
  { path: '/inventory', label: 'Inventory & depots', icon: Boxes, group: 'Back office' },
  { path: '/vendors', label: 'Vendors', icon: Truck, group: 'Back office' },
  { path: '/finance', label: 'Finance', icon: Receipt, group: 'Back office' },
  { path: '/people', label: 'Payroll & HR', icon: Wallet, group: 'Back office' },
];

export const NAV_GROUPS = ['My work', 'Sales', 'Back office'] as const;

export function navFor(pathname: string): NavItem {
  if (pathname.startsWith('/events/')) return { path: pathname, label: 'Event workspace', icon: ListChecks, group: 'My work' };
  return NAV.find((n) => n.path !== '/' && pathname.startsWith(n.path)) ?? NAV[0];
}
