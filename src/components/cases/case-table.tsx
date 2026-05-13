'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils/cn';
import { CaseStatusBadge } from './case-status-badge';
import { getCases, type CaseFilters } from '@/lib/api/cases';
import { formatRelative } from '@/lib/utils/format-date';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { ICase } from '@/types';

const columnHelper = createColumnHelper<ICase>();

// PAGE_SIZE is now stateful — see useState below

function SortIcon({ isSorted }: { isSorted: false | 'asc' | 'desc' }) {
  if (isSorted === 'asc') return <ChevronUp className="inline h-3.5 w-3.5 ml-1" />;
  if (isSorted === 'desc') return <ChevronDown className="inline h-3.5 w-3.5 ml-1" />;
  return <ChevronsUpDown className="inline h-3.5 w-3.5 ml-1 text-muted-foreground" />;
}

const baseColumns = [
  columnHelper.accessor('deceasedName', {
    id: 'deceasedName',
    header: ({ column }) => (
      <button
        className="flex items-center font-medium hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        aria-label="Sort by deceased name"
      >
        Deceased
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor('status', {
    header: () => <span className="font-medium">Status</span>,
    cell: (info) => <CaseStatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor((row) => (row as any).assignedTo, {
    id: 'assignedTo',
    header: () => <span className="font-medium">Assigned</span>,
    cell: (info) => {
      const val = info.getValue();
      const display = val?.name ?? val ?? '—';
      return <span className="text-muted-foreground text-sm">{display}</span>;
    },
  }),
  columnHelper.accessor('updatedAt', {
    id: 'updatedAt',
    header: ({ column }) => (
      <button
        className="flex items-center font-medium hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        aria-label="Sort by last updated"
      >
        Last updated
        <SortIcon isSorted={column.getIsSorted()} />
      </button>
    ),
    cell: (info) => (
      <span className="text-muted-foreground text-sm">{formatRelative(info.getValue())}</span>
    ),
  }),
];

const overdueColumn = columnHelper.accessor('overdueTaskCount', {
  id: 'overdueTaskCount',
  header: () => <span className="font-medium">Overdue Tasks</span>,
  cell: (info) => {
    const count = info.getValue() ?? 0;
    return count > 0 ? (
      <Badge variant="destructive" className="text-xs">{count} overdue</Badge>
    ) : null;
  },
});

function buildFilters(filter?: string): CaseFilters {
  if (filter === 'active' || filter === 'overdue' || filter === 'this-month' || filter === 'pending-signatures') {
    return { dashboardFilter: filter };
  }
  return {};
}

export function CaseTable({ filter }: { filter?: string }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const { data: cases = [], isLoading, error, refetch } = useQuery({
    queryKey: ['cases', filter],
    queryFn: () => getCases(buildFilters(filter)),
  });

  const columns = filter === 'overdue'
    ? [...baseColumns, overdueColumn]
    : baseColumns;

  const table = useReactTable({
    data: cases,
    columns,
    state: { sorting, pagination: { pageIndex, pageSize } },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPageIndex(0);
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border p-6 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Failed to load cases.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center space-y-2">
        <p className="text-muted-foreground text-sm">No cases yet.</p>
        <p className="text-xs text-muted-foreground">
          Share your intake form link to get started.
        </p>
      </div>
    );
  }

  const totalRows = cases.length;
  const firstRow = pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      (header.id === 'assignedTo' || header.id === 'updatedAt' || header.id === 'overdueTaskCount') &&
                        'hidden sm:table-cell',
                    )}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:bg-muted"
                tabIndex={0}
                onClick={() => router.push(`/cases/${row.original.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/cases/${row.original.id}`);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      (cell.column.id === 'assignedTo' || cell.column.id === 'updatedAt' || cell.column.id === 'overdueTaskCount') &&
                        'hidden sm:table-cell',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <p className="text-sm text-muted-foreground">
          {totalRows > 0 ? `Showing ${firstRow}–${lastRow} of ${totalRows} cases` : ''}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(v) => { setPageSize(Number(v)); setPageIndex(0); }}
          >
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {totalRows > pageSize && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex((p) => p + 1)}
                disabled={lastRow >= totalRows}
              >
                Next
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
