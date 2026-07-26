"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
  /** Stable row id. Recommended whenever `selectableRows` or `expandable` is used. */
  getRowId?: (row: TData, index: number) => string;

  // ---- pagination ----
  pagination?: boolean;
  paginationPerPage?: number;
  paginationRowsPerPageOptions?: number[];
  paginationServer?: boolean;
  paginationTotalRows?: number;
  onChangePage?: (pageIndex: number) => void;
  onChangeRowsPerPage?: (pageSize: number) => void;

  // ---- selection ----
  selectableRows?: boolean;
  selectableRowDisabled?: (row: TData) => boolean;
  onSelectedRowsChange?: (state: { selectedRows: TData[] }) => void;

  // ---- expand ----
  /** Enable the left-side chevron toggle column. Default: false. */
  expandable?: boolean;
  /** Content rendered in a full-width row directly under an expanded row. Receives the TanStack Row instance (use `row.original` for the data). */
  expandedRowContent?: (row: Row<TData>) => React.ReactNode;
  /** If true, only one row can be expanded at a time (expanding one collapses the rest). */
  expandableSingle?: boolean;
  /** Called whenever the expanded row set changes. */
  onExpandedRowsChange?: (expandedRowIds: string[]) => void;

  // ---- search ----
  searchable?: boolean;
  searchPlaceholder?: string;
  searchServer?: boolean;
  onSearchChange?: (query: string) => void;

  // ---- sorting ----
  sortServer?: boolean;
  onSortChange?: (sorting: SortingState) => void;

  // ---- display ----
  dense?: boolean;
  striped?: boolean;
  highlightOnHover?: boolean;
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  title?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * All-in-one data table: one import, prop-driven.
 *
 *   <CustomDataTable
 *     data={data}
 *     columns={columns}
 *     expandable
 *     expandedRowContent={(row) => <OrderDetails order={row.original} />}
 *   />
 */
export function CustomDataTable<TData>({
  data,
  columns,
  getRowId,

  pagination = true,
  paginationPerPage = 10,
  paginationRowsPerPageOptions = [10, 20, 30, 50],
  paginationServer = false,
  paginationTotalRows,
  onChangePage,
  onChangeRowsPerPage,

  selectableRows = false,
  selectableRowDisabled,
  onSelectedRowsChange,

  expandable = false,
  expandedRowContent,
  expandableSingle = false,
  onExpandedRowsChange,

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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: paginationPerPage,
  });

  const toggleRowExpanded = (rowId: string) => {
    setExpandedRows((prev) => {
      const isOpen = Boolean(prev[rowId]);
      const next = expandableSingle
        ? isOpen
          ? {}
          : { [rowId]: true }
        : { ...prev, [rowId]: !isOpen };

      onExpandedRowsChange?.(
        Object.keys(next).filter((id) => next[id]),
      );
      return next;
    });
  };

  // Auto-inject the expand chevron + checkbox columns. Neither depends on
  // `expandedRows`/`rowSelection` directly — they read current state via
  // `table.options.meta` at render time, so toggling doesn't force a full
  // columns rebuild.
  const resolvedColumns = useMemo<ColumnDef<TData, any>[]>(() => {
    let result = columns;

    if (selectableRows) {
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
        size: 20,
      };
      result = [selectionColumn, ...result];
    }

    if (expandable) {
      const expandColumn: ColumnDef<TData, any> = {
        id: "__expand",
        header: () => null,
        cell: ({ row, table }) => {
          const meta = table.options.meta as
            | {
                expandedRows?: Record<string, boolean>;
                toggleRowExpanded?: (id: string) => void;
              }
            | undefined;
          const isExpanded = Boolean(meta?.expandedRows?.[row.id]);

          return (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                meta?.toggleRowExpanded?.(row.id);
              }}
              aria-label={isExpanded ? "Satırı daralt" : "Satırı genişlet"}
              aria-expanded={isExpanded}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronRight
                className={cn(
                  "size-4 transition-transform duration-150",
                  isExpanded && "rotate-90",
                )}
              />
            </button>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 32,
      };
      result = [expandColumn, ...result];
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, selectableRows, expandable]);

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

    // Exposed to cell renderers via `table.options.meta` — lets the expand
    // column read live state without being a dependency of resolvedColumns.
    meta: {
      expandedRows,
      toggleRowExpanded,
    },

    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
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
            {table.getHeaderGroups().map((headerGroup, index) => (
              <tr key={index}>
                {headerGroup.headers.map((header, idx) => {
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
                      key={idx}
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
                      style={
                        header.column.columnDef.size !== undefined
                          ? {
                              width: header.column.columnDef.size,
                              minWidth: header.column.columnDef.size,
                              maxWidth: header.column.columnDef.size,
                            }
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
              rows.map((row, index) => {
                const isExpanded = expandable && Boolean(expandedRows[row.id]);

                return (
                  <Fragment key={row.id}>
                    <tr
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
                        isExpanded && "border-b-0",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={`${row.id}-${cell.column.id}`}
                          style={
                            cell.column.columnDef.size !== undefined
                              ? {
                                  width: cell.column.columnDef.size,
                                  minWidth: cell.column.columnDef.size,
                                  maxWidth: cell.column.columnDef.size,
                                }
                              : undefined
                          }
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

                    {isExpanded && expandedRowContent && (
                      <tr key={`${row.id}-expanded`} className="border-b border-border last:border-0">
                        <td colSpan={columnCount} className="bg-muted/20 p-0">
                          <div className={dense ? "px-3 py-2" : "px-4 py-3"}>
                            {expandedRowContent(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
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