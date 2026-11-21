import type { ReactNode } from 'react';
import { cn } from '@/utils/format';
import { EmptyState, Skeleton } from './Feedback';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => number | string;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Records will appear here once they are added.',
  emptyAction,
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3 p-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-5">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    );
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key} className={column.headerClassName}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(onRowClick && 'cursor-pointer')}
            >
              {columns.map(column => (
                <td key={column.key} className={column.className}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
