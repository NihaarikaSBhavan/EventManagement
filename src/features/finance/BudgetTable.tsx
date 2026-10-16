import { DataTable } from '@/components/ui/DataTable';
import type { departmentBudgets } from '@/domain/selectors';
import { formatINR, percent } from '@/lib/format';

type Row = ReturnType<typeof departmentBudgets>[number];

export function BudgetTable({ rows }: { rows: Row[] }) {
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.department}
      minWidth={860}
      columns={[
        { id: 'd', header: 'Department', sortValue: (r) => r.department, cell: (r) => <span className="font-medium">{r.department}</span> },
        { id: 'b', header: 'Budget', align: 'right', sortValue: (r) => r.budget, cell: (r) => <span className="tabular">{formatINR(r.budget)}</span> },
        { id: 's', header: 'Spent', align: 'right', sortValue: (r) => r.spent, cell: (r) => <span className="tabular">{formatINR(r.spent)}</span> },
        { id: 'c', header: 'Committed', align: 'right', sortValue: (r) => r.committed, cell: (r) => <span className="text-warning tabular">{formatINR(r.committed)}</span> },
        { id: 'h', header: 'Headroom', align: 'right', sortValue: (r) => r.headroom, cell: (r) => <span className={`font-medium tabular ${r.headroom < 0 ? 'text-danger' : ''}`}>{formatINR(r.headroom)}</span> },
        {
          id: 'u', header: 'Utilization', width: '220px', sortValue: (r) => percent(r.spent + r.committed, r.budget),
          cell: (r) => {
            const sp = Math.min(100, percent(r.spent, r.budget));
            const cm = Math.min(100 - sp, percent(r.committed, r.budget));
            return (
              <div className="flex items-center gap-2">
                <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${sp}% spent, ${cm}% committed`}>
                  <div className="h-full bg-primary" style={{ width: `${sp}%` }} />
                  <div className="h-full bg-chart-2" style={{ width: `${cm}%` }} />
                </div>
                <span className="w-12 text-right font-mono text-xs text-fg-muted">{percent(r.spent + r.committed, r.budget)}%</span>
              </div>
            );
          },
        },
      ]}
    />
  );
}
