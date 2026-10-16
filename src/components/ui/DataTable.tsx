import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Return a comparable value to make the column sortable. */
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right';
  width?: string;
  className?: string;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  empty?: ReactNode;
  minWidth?: number;
  dense?: boolean;
}

export function DataTable<T>({ rows, columns, rowKey, onRowClick, selectedKey, empty, minWidth = 720, dense }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ id: string; dir: 1 | -1 } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.id === sort.id);
    if (!col?.sortValue) return rows;
    return [...rows].sort((a, b) => {
      const x = col.sortValue!(a), y = col.sortValue!(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [rows, columns, sort]);

  const toggle = (id: string) =>
    setSort((s) => (!s || s.id !== id ? { id, dir: 1 } : s.dir === 1 ? { id, dir: -1 } : null));

  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse text-left" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => {
              const active = sort?.id === c.id;
              const Icon = active ? (sort!.dir === 1 ? ArrowUp : ArrowDown) : ChevronsUpDown;
              return (
                <th
                  key={c.id}
                  scope="col"
                  style={{ width: c.width }}
                  aria-sort={active ? (sort!.dir === 1 ? 'ascending' : 'descending') : undefined}
                  className={cn('sticky top-0 z-[1] bg-subtle px-3 py-2 text-2xs font-medium uppercase tracking-wider text-fg-subtle first:pl-4 last:pr-4', c.align === 'right' && 'text-right')}
                >
                  {c.sortValue ? (
                    <button type="button" onClick={() => toggle(c.id)} className={cn('inline-flex items-center gap-1 uppercase tracking-wider hover:text-fg', c.align === 'right' && 'flex-row-reverse', active && 'text-fg')}>
                      {c.header}
                      <Icon aria-hidden className="size-3 opacity-70" />
                    </button>
                  ) : c.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const key = rowKey(row);
            return (
              <tr
                key={key}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'group border-b border-line/70 last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-subtle',
                  selectedKey === key && 'bg-primary-soft/60 hover:bg-primary-soft/60',
                )}
              >
                {columns.map((c) => (
                  <td key={c.id} className={cn('px-3 align-middle text-[13px] first:pl-4 last:pr-4', dense ? 'py-2' : 'py-2.5', c.align === 'right' && 'text-right', c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
