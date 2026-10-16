import { Boxes, CalendarDays, ClipboardList, LayoutDashboard, Receipt, Truck, Users, Wallet, type LucideIcon } from 'lucide-react';

export interface NavItem { path: string; label: string; icon: LucideIcon; group: 'Overview' | 'Commercial' | 'Operations' | 'People & money' }

export const NAV: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { path: '/calendar', label: 'Production calendar', icon: CalendarDays, group: 'Overview' },
  { path: '/leads', label: 'CRM & leads', icon: Users, group: 'Commercial' },
  { path: '/jobs', label: 'Job orders', icon: ClipboardList, group: 'Operations' },
  { path: '/inventory', label: 'Inventory & depots', icon: Boxes, group: 'Operations' },
  { path: '/vendors', label: 'Vendors & logistics', icon: Truck, group: 'Operations' },
  { path: '/finance', label: 'Finance & invoicing', icon: Receipt, group: 'People & money' },
  { path: '/people', label: 'Payroll & HR', icon: Wallet, group: 'People & money' },
];

export const NAV_GROUPS = ['Overview', 'Commercial', 'Operations', 'People & money'] as const;

export function navFor(pathname: string): NavItem {
  return NAV.find((n) => n.path !== '/' && pathname.startsWith(n.path)) ?? NAV[0];
}
