import { Mail, Printer } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Status } from '@/components/ui/Status';
import { Segmented } from '@/components/ui/Tabs';
import { DetailGrid } from '@/components/shared/Detail';
import { payBreakdown, transferModeFor } from '@/domain/selectors';
import { payTone } from '@/domain/tones';
import { notify } from '@/hooks/useAction';
import { formatStamp } from '@/lib/dates';
import { amountInWords, formatINR } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';

export function PayslipDialog({ code, onClose }: { code: string | null; onClose: () => void }) {
  const employee = useAppStore((s) => s.data.employees.find((e) => e.code === code));
  const send = useAppStore((s) => s.sendPayslip);
  const [mode, setMode] = useState<'slip' | 'pdf'>('slip');
  if (!employee) return null;

  const pay = payBreakdown(employee);
  const earnings = [['Basic salary', employee.basic], ['House rent allowance', employee.hra], ['Site allowances', employee.siteAllowance]] as const;
  const deductions = [['Tax deducted at source (TDS)', employee.tds], ['Provident fund (PF)', employee.pf]] as const;
  const transfer = employee.transfer
    ? `Credited via ${employee.transfer.mode} · UTR ${employee.transfer.utr} · ${formatStamp(employee.transfer.at)}`
    : `Transfer via ${transferModeFor(pay.net)} once ${employee.payStatus === 'Approved' ? 'disbursed' : 'approved and disbursed'}`;

  const Ledger = ({ title, rows, total, totalLabel }: { title: string; rows: readonly (readonly [string, number])[]; total: number; totalLabel: string }) => (
    <div className="rounded-lg border border-line">
      <p className="border-b border-line px-3 py-2 text-2xs font-medium uppercase tracking-wider text-fg-subtle">{title}</p>
      <ul className="px-3 py-1">
        {rows.map(([l, v]) => <li key={l} className="flex justify-between py-1.5 text-[13px]"><span className="text-fg-muted">{l}</span><span className="tabular">{formatINR(v)}</span></li>)}
      </ul>
      <p className="flex justify-between border-t border-line px-3 py-2 text-[13px] font-semibold"><span>{totalLabel}</span><span className="tabular">{formatINR(total)}</span></p>
    </div>
  );

  return (
    <Dialog
      open
      onOpenChange={(o) => { if (!o) { setMode('slip'); onClose(); } }}
      title={`Payslip · ${employee.name}`}
      description={`October 2026 · ${employee.code}`}
      size="lg"
      footer={
        <>
          {mode === 'pdf' && <Button onClick={() => window.print()}><Printer />Print / Save PDF</Button>}
          <Button onClick={() => notify(send(employee.code))}><Mail />{employee.payslipSentAt ? 'Resend payslip' : 'Email payslip'}</Button>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented label="Payslip view" value={mode} onChange={setMode} options={[{ value: 'slip', label: 'Payslip' }, { value: 'pdf', label: 'PDF export preview' }]} />
          <Status tone={payTone[employee.payStatus]}>{employee.payStatus}</Status>
        </div>

        {mode === 'slip' ? (
          <>
            <DetailGrid items={[
              { label: 'Designation', value: employee.designation },
              { label: 'Department', value: employee.department },
              { label: 'Location', value: employee.location },
              { label: 'Bank account', value: <span className="font-mono">{employee.bankMasked}</span> },
              { label: 'PAN', value: <span className="font-mono">{employee.pan}</span> },
              { label: 'Payslip emailed', value: employee.payslipSentAt ? formatStamp(employee.payslipSentAt) : 'Not yet' },
            ]} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Ledger title="Earnings" rows={earnings} total={pay.gross} totalLabel="Gross earnings" />
              <Ledger title="Statutory deductions" rows={deductions} total={pay.deductions} totalLabel="Total deductions" />
            </div>
            <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-success/30 bg-success-soft px-4 py-3">
              <div><p className="text-2xs font-medium uppercase tracking-wider text-success">Net pay · October 2026</p><p className="mt-1 text-xs text-fg-muted">Rupees {amountInWords(pay.net)} Only</p></div>
              <p className="text-2xl font-semibold tracking-tight text-success tabular">{formatINR(pay.net)}</p>
            </div>
            <p className="text-xs text-fg-subtle">{transfer}</p>
          </>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-muted p-4 sm:p-6">
            <article className="mx-auto w-[560px] bg-white p-8 text-[12px] leading-5 text-neutral-900 shadow-sm">
              <header className="flex justify-between gap-4 border-b-2 border-neutral-900 pb-3">
                <div><p className="text-[15px] font-bold">Event Management System Pvt. Ltd.</p><p className="text-neutral-600">Ambattur Industrial Estate, Chennai 600058</p></div>
                <div className="text-right"><p className="font-bold tracking-wide">PAYSLIP</p><p className="text-neutral-600">October 2026</p></div>
              </header>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1">
                {[['Name', employee.name], ['Code', employee.code], ['Designation', employee.designation], ['Department', employee.department], ['PAN', employee.pan], ['Bank', employee.bankMasked]].map(([k, v]) => (
                  <div key={k} className="flex gap-2"><dt className="w-24 shrink-0 text-neutral-500">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-6">
                {[['Earnings', earnings, pay.gross, 'Gross'], ['Deductions', deductions, pay.deductions, 'Total']].map(([title, rows, total, label]) => (
                  <table key={title as string} className="w-full">
                    <thead><tr><th colSpan={2} className="border-b border-neutral-300 pb-1 text-left font-bold">{title as string}</th></tr></thead>
                    <tbody>
                      {(rows as readonly (readonly [string, number])[]).map(([l, v]) => <tr key={l}><td className="py-0.5 pr-2">{l}</td><td className="text-right tabular">{formatINR(v)}</td></tr>)}
                      <tr className="font-bold"><td className="border-t border-neutral-300 pt-1">{label as string}</td><td className="border-t border-neutral-300 pt-1 text-right tabular">{formatINR(total as number)}</td></tr>
                    </tbody>
                  </table>
                ))}
              </div>
              <p className="mt-5 flex justify-between bg-neutral-100 px-3 py-2 text-[14px] font-bold"><span>Net pay</span><span className="tabular">{formatINR(pay.net)}</span></p>
              <p className="mt-2">Rupees {amountInWords(pay.net)} Only</p>
              <p className="mt-4 text-[11px] text-neutral-500">{transfer}. Computer-generated payslip; no signature required.</p>
            </article>
          </div>
        )}
      </div>
    </Dialog>
  );
}
