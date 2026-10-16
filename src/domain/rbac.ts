import { HIGH_VALUE_EXPENSE } from './constants';
import type { Persona, Role } from './types';

export const ROLE_RANK: Record<Role, number> = { MD_CEO: 5, DEPT_HEAD: 4, MANAGER: 3, TEAM_LEAD: 2, EXECUTIVE: 1 };

export const ROLE_LABEL: Record<Role, string> = {
  MD_CEO: 'Managing Director & CEO',
  DEPT_HEAD: 'Head of Department',
  MANAGER: 'Manager',
  TEAM_LEAD: 'Team Lead',
  EXECUTIVE: 'Executive',
};

export const ROLE_SCOPE: Record<Role, string> = {
  MD_CEO: 'Company-wide P&L, bank balances, high-value expense sign-off and payroll NEFT / RTGS authorization.',
  DEPT_HEAD: 'Department budgets, contractor sign-offs, payroll approval and job order approvals.',
  MANAGER: 'Staging execution, freight logistics, customer invoicing, payroll submission and scheduling.',
  TEAM_LEAD: 'Job order QC, checklist verification, technician shift logs and stock-in.',
  EXECUTIVE: 'Field task execution, checklist check-offs, own lead dossiers and personal payslip.',
};

/**
 * Minimum role rank required for each capability. Keeping the matrix in one place
 * means UI gating and store-side enforcement can never drift apart.
 */
export const PERMISSIONS = {
  'company.pnl': 5,
  'expense.signoffHighValue': 5,
  'payroll.approve': 4,
  'payroll.disburse': 4,
  'staff.enroll': 4,
  'vendor.setStatus': 4,
  'bill.release': 4,
  'budget.oversee': 4,
  'expense.approve': 4,
  'payroll.submit': 3,
  'payroll.viewAll': 3,
  'finance.view': 3,
  'invoice.create': 3,
  'invoice.setStatus': 3,
  'vendor.register': 3,
  'inventory.register': 3,
  'job.create': 3,
  'lead.convert': 3,
  'event.schedule': 3,
  'event.setStatus': 3,
  'job.verify': 2,
  'inventory.stockIn': 2,
  'expense.record': 2,
  'lead.viewAll': 2,
  'job.checklist': 1,
  'lead.create': 1,
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return ROLE_RANK[role] >= PERMISSIONS[permission];
}

export function canDecideExpense(role: Role, amount: number): boolean {
  return amount > HIGH_VALUE_EXPENSE ? can(role, 'expense.signoffHighValue') : can(role, 'expense.approve');
}

export function minimumRoleFor(permission: Permission): Role {
  const rank = PERMISSIONS[permission];
  return (Object.keys(ROLE_RANK) as Role[]).find((r) => ROLE_RANK[r] === rank) ?? 'MD_CEO';
}

export const PERSONAS: Persona[] = [
  { id: 'u1', name: 'K. Sundararajan', role: 'MD_CEO', title: 'Managing Director & CEO', employeeCode: 'EMS-001' },
  { id: 'u2', name: 'Anandha Krishnan', role: 'DEPT_HEAD', title: 'Head of Event Production', employeeCode: 'EMS-002' },
  { id: 'u3', name: 'Senthil Kumar', role: 'MANAGER', title: 'Senior Operations & Logistics Manager', employeeCode: 'EMS-003' },
  { id: 'u4', name: 'Hariprasad Nair', role: 'TEAM_LEAD', title: 'Technical AV & Rigging Team Lead', employeeCode: 'EMS-004' },
  { id: 'u5', name: 'Gautham Vasudevan', role: 'EXECUTIVE', title: 'Senior Production Executive', employeeCode: 'EMS-005' },
  { id: 'u6', name: 'Keerthana Murali', role: 'EXECUTIVE', title: 'Senior Sales Executive', employeeCode: 'EMS-006' },
];
