import { can, canDecideExpense, minimumRoleFor } from './rbac';

describe('RBAC', () => {
  it('lets only MD_CEO and DEPT_HEAD authorize payroll', () => {
    expect(can('MD_CEO', 'payroll.disburse')).toBe(true);
    expect(can('DEPT_HEAD', 'payroll.approve')).toBe(true);
    expect(can('MANAGER', 'payroll.approve')).toBe(false);
    expect(can('MANAGER', 'payroll.submit')).toBe(true);
  });
  it('reserves high-value expense sign-off for MD_CEO', () => {
    expect(canDecideExpense('DEPT_HEAD', 4_00_000)).toBe(true);
    expect(canDecideExpense('DEPT_HEAD', 6_50_000)).toBe(false);
    expect(canDecideExpense('MD_CEO', 6_50_000)).toBe(true);
    expect(canDecideExpense('MANAGER', 10_000)).toBe(false);
  });
  it('hides finance below MANAGER', () => {
    expect(can('TEAM_LEAD', 'finance.view')).toBe(false);
    expect(can('EXECUTIVE', 'job.checklist')).toBe(true);
  });
  it('names the minimum role for a permission', () => {
    expect(minimumRoleFor('job.verify')).toBe('TEAM_LEAD');
  });
});
