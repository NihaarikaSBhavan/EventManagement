import { BadgeIndianRupee, Banknote, FileText, Plus, Send, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Callout } from '@/components/ui/Feedback';
import { Stat } from '@/components/ui/Stat';
import { Meta, Status } from '@/components/ui/Status';
import { PageTabs } from '@/components/ui/Tabs';
import { GatedButton } from '@/components/shared/Gate';
import { PageHeader } from '@/components/shared/PageHeader';
import { PAY_STATUSES } from '@/domain/constants';
import { payBreakdown, transferModeFor } from '@/domain/selectors';
import { payTone } from '@/domain/tones';
import type { Employee, PayStatus } from '@/domain/types';
import { notify } from '@/hooks/useAction';
import { useCan, usePersona } from '@/hooks/usePermission';
import { formatINR } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { EnrollDialog } from './EnrollDialog';
import { PayslipDialog } from './PayslipDialog';

const NEXT: Partial<Record<PayStatus, PayStatus>> = { Draft: 'Pending Approval', 'Pending Approval': 'Approved', Approved: 'Disbursed' };

export function PeoplePage() {
  const employees = useAppStore((s) => s.data.employees);
  const advance = useAppStore((s) => s.advancePay);
  const bulk = useAppStore((s) => s.advancePayBulk);
  const persona = usePersona();
  const viewAll = useCan('payroll.viewAll');
  const canSubmit = useCan('payroll.submit');
  const canApprove = useCan('payroll.approve');
  const [tab, setTab] = useState<'payroll' | 'directory'>('payroll');
  const [slipCode, setSlipCode] = useState<string | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);

  const register = viewAll ? employees : employees.filter((e) => e.name === persona.name);
  const totals = useMemo(() => {
    const sum = (fn: (e: Employee) => number, list = register) => list.reduce((s, e) => s + fn(e), 0);
    const count = (st: PayStatus) => register.filter((e) => e.payStatus === st).length;
    return {
      gross: sum((e) => payBreakdown(e).gross), net: sum((e) => payBreakdown(e).net), deductions: sum((e) => payBreakdown(e).deductions),
      disbursed: sum((e) => payBreakdown(e).net, register.filter((e) => e.payStatus === 'Disbursed')),
      counts: Object.fromEntries(PAY_STATUSES.map((s) => [s, count(s)])) as Record<PayStatus, number>,
    };
  }, [register]);

  const actionFor = (e: Employee) => {
    const to = NEXT[e.payStatus];
    if (!to) return <span className="font-mono text-2xs text-fg-subtle">{e.transfer?.mode} · {e.transfer?.utr}</span>;
    if (to === 'Pending Approval') return <GatedButton permission="payroll.submit" size="sm" onClick={() => notify(advance(e.code, to))}>Submit</GatedButton>;
    if (to === 'Approved') return <GatedButton permission="payroll.approve" size="sm" variant="primary" onClick={() => notify(advance(e.code, to))}>Authorize</GatedButton>;
    return <GatedButton permission="payroll.disburse" size="sm" variant="success" onClick={() => notify(advance(e.code, to))}><Send />{transferModeFor(payBreakdown(e).net)}</GatedButton>;
  };

  const payColumns: Column<Employee>[] = [
    { id: 'name', header: 'Employee', sortValue: (e) => e.name, cell: (e) => <div><p className="font-medium">{e.name}</p><Meta items={[<span key="c" className="font-mono">{e.code}</span>, e.designation]} /></div> },
    { id: 'dept', header: 'Department', sortValue: (e) => e.department, cell: (e) => <span className="text-fg-muted">{e.department}</span> },
    { id: 'basic', header: 'Basic', align: 'right', sortValue: (e) => e.basic, cell: (e) => <span className="tabular">{formatINR(e.basic)}</span> },
    { id: 'hra', header: 'HRA', align: 'right', cell: (e) => <span className="tabular">{formatINR(e.hra)}</span> },
    { id: 'site', header: 'Site allow.', align: 'right', cell: (e) => <span className="tabular">{formatINR(e.siteAllowance)}</span> },
    { id: 'tds', header: 'TDS', align: 'right', cell: (e) => <span className="text-fg-muted tabular">−{formatINR(e.tds)}</span> },
    { id: 'pf', header: 'PF', align: 'right', cell: (e) => <span className="text-fg-muted tabular">−{formatINR(e.pf)}</span> },
    { id: 'net', header: 'Net pay', align: 'right', sortValue: (e) => payBreakdown(e).net, cell: (e) => <span className="font-semibold tabular">{formatINR(payBreakdown(e).net)}</span> },
    { id: 'status', header: 'Status', sortValue: (e) => PAY_STATUSES.indexOf(e.payStatus), cell: (e) => <Status tone={payTone[e.payStatus]}>{e.payStatus}</Status> },
    {
      id: 'actions', header: '', width: '240px',
      cell: (e) => (
        <div className="flex items-center justify-end gap-1.5">
          {actionFor(e)}
          <Button size="sm" variant="ghost" onClick={() => setSlipCode(e.code)}><FileText />Payslip</Button>
        </div>
      ),
    },
  ];

  const dirColumns: Column<Employee>[] = [
    { id: 'code', header: 'Code', sortValue: (e) => e.code, cell: (e) => <span className="font-mono text-xs">{e.code}</span> },
    { id: 'name', header: 'Name', sortValue: (e) => e.name, cell: (e) => <div><p className="font-medium">{e.name}</p><p className="text-xs text-fg-subtle">{e.designation}</p></div> },
    { id: 'dept', header: 'Department', sortValue: (e) => e.department, cell: (e) => e.department },
    { id: 'reports', header: 'Reporting line', sortValue: (e) => e.reportsTo, cell: (e) => <span className="text-fg-muted">{e.reportsTo}</span> },
    { id: 'tl', header: 'Team lead', cell: (e) => <span className="text-fg-muted">{e.teamLead ?? '—'}</span> },
    { id: 'att', header: 'Attendance', align: 'right', sortValue: (e) => e.attendance, cell: (e) => <span className={`tabular ${e.attendance < 92 ? 'font-medium text-warning' : ''}`}>{e.attendance}%</span> },
    { id: 'leave', header: 'Leave balance', align: 'right', sortValue: (e) => e.leaveBalance, cell: (e) => <span className="tabular">{e.leaveBalance} days</span> },
    { id: 'loc', header: 'Location', sortValue: (e) => e.location, cell: (e) => e.location },
  ];

  const tiers = ['EMS-001', 'EMS-002', 'EMS-003', 'EMS-004', 'EMS-005', 'EMS-006'].map((c) => employees.find((e) => e.code === c)).filter(Boolean) as Employee[];

  return (
    <>
      <PageHeader
        title="Payroll & human resources"
        description="October 2026 payroll register, payslips and the staff directory with reporting lines."
        actions={<GatedButton permission="staff.enroll" variant="primary" onClick={() => setEnrollOpen(true)}><Plus />Enroll new personnel</GatedButton>}
      >
        <PageTabs value={tab} onChange={setTab} options={[{ value: 'payroll', label: 'Monthly payroll register' }, { value: 'directory', label: 'Staff directory & org hierarchy', count: employees.length }]} />
      </PageHeader>

      {tab === 'payroll' ? (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Gross payroll · Oct 2026" icon={BadgeIndianRupee} value={formatINR(totals.gross)} footnote={`${register.length} on register`} />
            <Stat label="Net payable" value={formatINR(totals.net)} footnote={`after ${formatINR(totals.deductions)} TDS + PF`} />
            <Stat label="Disbursed" icon={Banknote} tone="success" value={formatINR(totals.disbursed)} footnote="via NEFT / RTGS" />
            <Stat label="Lifecycle" value={<span className="text-base">{totals.counts.Disbursed}/{register.length} paid</span>}
              footnote={<Meta items={PAY_STATUSES.map((s) => `${totals.counts[s]} ${s}`)} />} />
          </section>

          {!viewAll && <Callout tone="info" icon={Users} title="Showing your own payslip only">The full register is visible to MANAGER and above.</Callout>}

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              <p className="font-mono text-xs text-fg-muted">Net Pay = (Basic + HRA + Site Allowances) − (TDS + PF)</p>
              {(canSubmit || canApprove) && (
                <div className="flex flex-wrap gap-2">
                  {canSubmit && <Button size="sm" disabled={!totals.counts.Draft} onClick={() => notify(bulk('Draft', 'Pending Approval'))}>Submit all drafts</Button>}
                  {canApprove && <Button size="sm" disabled={!totals.counts['Pending Approval']} onClick={() => notify(bulk('Pending Approval', 'Approved'))}>Authorize all pending</Button>}
                  {canApprove && <Button size="sm" variant="success" disabled={!totals.counts.Approved} onClick={() => notify(bulk('Approved', 'Disbursed'))}><Send />Disburse all approved</Button>}
                </div>
              )}
            </div>
            <DataTable rows={register} columns={payColumns} rowKey={(e) => e.code} minWidth={1420} />
          </Card>
        </>
      ) : (
        <>
          <section aria-label="Org hierarchy" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tiers.map((e, i) => (
              <Card key={e.code} className="flex items-center gap-3 p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-subtle font-mono text-xs font-medium text-fg-muted">T{Math.min(i + 1, 5)}</span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{e.name}</p>
                  <Meta items={[e.designation, `reports to ${e.reportsTo}`]} />
                </div>
              </Card>
            ))}
          </section>
          <Card><DataTable rows={employees} columns={dirColumns} rowKey={(e) => e.code} minWidth={1100} /></Card>
        </>
      )}

      <PayslipDialog code={slipCode} onClose={() => setSlipCode(null)} />
      <EnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} onEnrolled={() => setTab('directory')} />
    </>
  );
}
