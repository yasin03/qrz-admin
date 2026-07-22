"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Inbox,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export type CustomDataTableProps<TData> = {
  /** Row data. */
  data: TData[];
  /** TanStack column defs — the same `columns` you'd pass to any TanStack table. */
  columns: ColumnDef<TData, any>[];
  /** Stable row id. Recommended whenever `selectableRows` is used. */
  getRowId?: (row: TData, index: number) => string;

  // ---- pagination ----
  /** Enable pagination footer + logic. Default: false (renders every row). */
  pagination?: boolean;
  paginationPerPage?: number;
  paginationRowsPerPageOptions?: number[];
  /** Server-driven pagination: you fetch each page yourself. */
  paginationServer?: boolean;
  /** Total row count on the server — required when `paginationServer` is true. */
  paginationTotalRows?: number;
  onChangePage?: (pageIndex: number) => void;
  onChangeRowsPerPage?: (pageSize: number) => void;

  // ---- selection ----
  selectableRows?: boolean;
  /** Return true to disable the checkbox for a given row. */
  selectableRowDisabled?: (row: TData) => boolean;
  onSelectedRowsChange?: (state: { selectedRows: TData[] }) => void;

  // ---- search ----
  /** Show a built-in global search box above the table. Default: false. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Server-driven search: you filter the data yourself and pass the result in via `data`. */
  searchServer?: boolean;
  onSearchChange?: (query: string) => void;

  // ---- sorting ----
  /** Server-driven sorting. */
  sortServer?: boolean;
  onSortChange?: (sorting: SortingState) => void;

  // ---- display ----
  /** Compact row height. Default: false. */
  dense?: boolean;
  striped?: boolean;
  highlightOnHover?: boolean;
  /** Shows a loading overlay and disables interaction. */
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  /** Rendered above the table, left side (e.g. a page title). */
  title?: React.ReactNode;
  /** Rendered above the table, right side, next to search (e.g. an "Add" button). */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * All-in-one data table: one import, prop-driven. Wraps TanStack Table
 * internally so you don't need to wire up column visibility, row models,
 * or state plumbing yourself — pass `data` + `columns` and toggle the
 * features you need.
 *
 *   <CustomDataTable data={data} columns={columns} />
 *
 *   <CustomDataTable
 *     data={data}
 *     columns={columns}
 *     pagination
 *     selectableRows
 *     onSelectedRowsChange={({ selectedRows }) => setSelected(selectedRows)}
 *     selectableRowDisabled={(row) => row.locked}
 *     dense
 *   />
 */
export function CustomDataTable<TData>({
  data,
  columns,
  getRowId,

  pagination = false,
  paginationPerPage = 10,
  paginationRowsPerPageOptions = [10, 20, 30, 50],
  paginationServer = false,
  paginationTotalRows,
  onChangePage,
  onChangeRowsPerPage,

  selectableRows = false,
  selectableRowDisabled,
  onSelectedRowsChange,

  searchable = false,
  searchPlaceholder = "Ara...",
  searchServer = false,
  onSearchChange,

  sortServer = false,
  onSortChange,

  dense = false,
  striped = false,
  highlightOnHover = true,
  loading = false,
  emptyMessage = "Kayıt bulunamadı.",
  onRowClick,
  title,
  actions,
  className,
}: CustomDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: paginationPerPage,
  });

  // Auto-inject the checkbox column when selectableRows is on, so callers
  // never have to build a selection ColumnDef themselves.
  const resolvedColumns = useMemo<ColumnDef<TData, any>[]>(() => {
    if (!selectableRows) return columns;

    const selectionColumn: ColumnDef<TData, any> = {
      id: "__select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(checked) =>
            table.toggleAllPageRowsSelected(checked === true)
          }
          aria-label="Tümünü seç"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(checked) => row.toggleSelected(checked === true)}
          onClick={(event) => event.stopPropagation()}
          aria-label="Satırı seç"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    };

    return [selectionColumn, ...columns];
  }, [columns, selectableRows]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getRowId,

    state: {
      sorting,
      globalFilter,
      rowSelection,
      ...(pagination && { pagination: paginationState }),
    },

    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      onSortChange?.(next);
    },
    onGlobalFilterChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(globalFilter) : updater;
      setGlobalFilter(next);
      onSearchChange?.(next);
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(paginationState) : updater;
      setPaginationState(next);
      if (next.pageIndex !== paginationState.pageIndex) {
        onChangePage?.(next.pageIndex);
      }
      if (next.pageSize !== paginationState.pageSize) {
        onChangeRowsPerPage?.(next.pageSize);
      }
    },

    enableRowSelection: selectableRowDisabled
      ? (row: Row<TData>) => !selectableRowDisabled(row.original)
      : selectableRows,

    manualSorting: sortServer,
    manualFiltering: searchServer,
    manualPagination: paginationServer,
    rowCount: paginationServer ? paginationTotalRows : undefined,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortServer ? undefined : getSortedRowModel(),
    getFilteredRowModel: searchServer ? undefined : getFilteredRowModel(),
    getPaginationRowModel:
      pagination && !paginationServer ? getPaginationRowModel() : undefined,
  });

  // Notify the caller with actual row objects whenever selection changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!selectableRows) return;
    onSelectedRowsChange?.({
      selectedRows: table.getSelectedRowModel().rows.map((r) => r.original),
    });
  }, [rowSelection, selectableRows]);

  const rows = table.getRowModel().rows;
  const columnCount = table.getVisibleLeafColumns().length;
  const cellPadding = dense ? "px-3 py-1.5" : "px-3 py-3";

  return (
    <div className={cn("space-y-3", className)}>
      {(title || actions || searchable) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <div className="text-base font-semibold text-foreground">
              {title}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative w-56 sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={globalFilter}
                  onChange={(event) =>
                    table.setGlobalFilter(event.target.value)
                  }
                  placeholder={searchPlaceholder}
                  className="pl-9"
                  aria-label={searchPlaceholder}
                />
                {globalFilter && (
                  <button
                    type="button"
                    onClick={() => table.setGlobalFilter("")}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Aramayı temizle"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            )}
            {actions}
          </div>
        </div>
      )}

      <div className="relative w-full overflow-auto rounded-lg border border-border">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <table className="w-full caption-bottom text-sm">
          <thead className="border-b border-border bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  const SortIcon =
                    sortDirection === "asc"
                      ? ArrowUp
                      : sortDirection === "desc"
                        ? ArrowDown
                        : ChevronsUpDown;

                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      scope="col"
                      aria-sort={
                        canSort
                          ? sortDirection === "asc"
                            ? "ascending"
                            : sortDirection === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
                      className={cn(
                        "text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
                        cellPadding,
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 hover:text-foreground"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <SortIcon className="size-3.5" />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row.original);
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "border-b border-border transition-colors last:border-0 data-[state=selected]:bg-accent",
                    striped && index % 2 === 1 && "bg-muted/30",
                    highlightOnHover && "hover:bg-muted/40",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(
                        "align-middle [&:has([role=checkbox])]:pr-0",
                        cellPadding,
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnCount} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Inbox className="size-6" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            {selectableRows
              ? `${table.getFilteredSelectedRowModel().rows.length} / ${table.getFilteredRowModel().rows.length} satır seçili`
              : `Toplam ${table.getFilteredRowModel().rows.length} kayıt`}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Sayfa başına
              </span>
              <select
                aria-label="Sayfa başına satır sayısı"
                value={table.getState().pagination.pageSize}
                onChange={(event) =>
                  table.setPageSize(Number(event.target.value))
                }
                className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {paginationRowsPerPageOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="text-sm font-medium text-foreground"
              aria-live="polite"
            >
              Sayfa{" "}
              {table.getPageCount() === 0
                ? 0
                : table.getState().pagination.pageIndex + 1}{" "}
              / {table.getPageCount()}
            </div>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                color="secondary"
                appearance="outline"
                size="icon-sm"
                aria-label="İlk sayfa"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                type="button"
                color="secondary"
                appearance="outline"
                size="icon-sm"
                aria-label="Önceki sayfa"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                color="secondary"
                appearance="outline"
                size="icon-sm"
                aria-label="Sonraki sayfa"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                type="button"
                color="secondary"
                appearance="outline"
                size="icon-sm"
                aria-label="Son sayfa"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}