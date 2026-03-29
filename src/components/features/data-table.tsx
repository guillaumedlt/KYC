"use client";

import { useState, useRef, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type Header,
} from "@tanstack/react-table";
import {
  ArrowUp, ArrowDown, ArrowUpDown, Search, X,
  Eye, EyeOff, SlidersHorizontal, Filter, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  data: T[];
  searchPlaceholder?: string;
}

export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = "Filtrer...",
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnMenu, setColumnMenu] = useState<string | null>(null);
  const [columnFilterInput, setColumnFilterInput] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [draggedCol, setDraggedCol] = useState<string | null>(null);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility, columnOrder: columnOrder.length ? columnOrder : undefined },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
  });

  const visibleCount = table.getVisibleLeafColumns().length;
  const totalCount = table.getAllLeafColumns().length;
  const hiddenCols = table.getAllLeafColumns().filter((c) => !c.getIsVisible());

  // Drag reorder
  function handleDragStart(colId: string) { setDraggedCol(colId); }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }
  function handleDrop(targetColId: string) {
    if (!draggedCol || draggedCol === targetColId) return;
    const currentOrder = columnOrder.length ? [...columnOrder] : table.getAllLeafColumns().map((c) => c.id);
    const fromIdx = currentOrder.indexOf(draggedCol);
    const toIdx = currentOrder.indexOf(targetColId);
    currentOrder.splice(fromIdx, 1);
    currentOrder.splice(toIdx, 0, draggedCol);
    setColumnOrder(currentOrder);
    setDraggedCol(null);
  }

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 w-full rounded-md border border-border bg-card pl-9 pr-8 text-[12px] text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:outline-none"
          />
          {globalFilter && (
            <button onClick={() => setGlobalFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Column visibility toggle */}
        <div className="relative">
          <button
            onClick={() => setColumnMenu(columnMenu === "__cols" ? null : "__cols")}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <SlidersHorizontal className="h-3 w-3" />
            Colonnes
            {hiddenCols.length > 0 && <span className="font-data text-[9px] text-muted-foreground/60">{visibleCount}/{totalCount}</span>}
          </button>
          {columnMenu === "__cols" && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setColumnMenu(null)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-card p-1 shadow-lg">
                {table.getAllLeafColumns().map((col) => (
                  <label key={col.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-[11px] text-foreground hover:bg-muted/30">
                    <input type="checkbox" checked={col.getIsVisible()} onChange={col.getToggleVisibilityHandler()} className="h-3 w-3 rounded border-border" />
                    {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <span className="shrink-0 font-data text-[11px] text-muted-foreground">
          {table.getFilteredRowModel().rows.length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full" style={{ width: table.getCenterTotalSize() }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => (
                  <ColumnHeader
                    key={header.id}
                    header={header}
                    columnMenu={columnMenu}
                    setColumnMenu={setColumnMenu}
                    columnFilterInput={columnFilterInput}
                    setColumnFilterInput={setColumnFilterInput}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isDragged={draggedCol === header.column.id}
                  />
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={visibleCount} className="px-4 py-10 text-center text-[12px] text-muted-foreground">
                  Aucun résultat
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="group border-b border-border/50 transition-colors last:border-0 hover:bg-muted/15">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5" style={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// COLUMN HEADER — with menu, sort, filter, resize, drag reorder
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ColumnHeader<T>({
  header,
  columnMenu,
  setColumnMenu,
  columnFilterInput,
  setColumnFilterInput,
  onDragStart,
  onDragOver,
  onDrop,
  isDragged,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  header: Header<T, any>;
  columnMenu: string | null;
  setColumnMenu: (id: string | null) => void;
  columnFilterInput: string | null;
  setColumnFilterInput: (id: string | null) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (id: string) => void;
  isDragged: boolean;
}) {
  const isMenuOpen = columnMenu === header.column.id;
  const isFiltering = columnFilterInput === header.column.id;
  const filterValue = (header.column.getFilterValue() as string) ?? "";

  return (
    <th
      className={cn(
        "relative select-none px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground",
        isDragged && "opacity-50",
      )}
      style={{ width: header.getSize() }}
      draggable
      onDragStart={() => onDragStart(header.column.id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(header.column.id)}
    >
      {header.isPlaceholder ? null : (
        <div className="flex items-center gap-1">
          {/* Column name — click to sort */}
          <button
            className={cn("flex items-center gap-1 transition-colors", header.column.getCanSort() && "cursor-pointer hover:text-foreground")}
            onClick={header.column.getToggleSortingHandler()}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
            {header.column.getCanSort() && (
              header.column.getIsSorted() === "asc" ? <ArrowUp className="h-3 w-3" /> :
              header.column.getIsSorted() === "desc" ? <ArrowDown className="h-3 w-3" /> :
              <ArrowUpDown className="h-3 w-3 opacity-20" />
            )}
          </button>

          {/* Column menu trigger */}
          <button
            onClick={() => setColumnMenu(isMenuOpen ? null : header.column.id)}
            className="ml-auto rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted/30 hover:text-foreground"
            style={{ opacity: isMenuOpen || filterValue ? 1 : undefined }}
          >
            <ChevronDown className={cn("h-3 w-3", filterValue && "text-foreground")} />
          </button>

          {/* Column menu dropdown */}
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => { setColumnMenu(null); setColumnFilterInput(null); }} />
              <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-card p-1 shadow-lg">
                {/* Sort options */}
                <button onClick={() => { header.column.toggleSorting(false); setColumnMenu(null); }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] text-foreground hover:bg-muted/30">
                  <ArrowUp className="h-3 w-3" /> Tri croissant
                </button>
                <button onClick={() => { header.column.toggleSorting(true); setColumnMenu(null); }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] text-foreground hover:bg-muted/30">
                  <ArrowDown className="h-3 w-3" /> Tri décroissant
                </button>
                {header.column.getIsSorted() && (
                  <button onClick={() => { header.column.clearSorting(); setColumnMenu(null); }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/30">
                    <X className="h-3 w-3" /> Retirer le tri
                  </button>
                )}

                <div className="my-1 border-t border-border" />

                {/* Filter */}
                <div className="px-2 py-1">
                  <div className="relative">
                    <Filter className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={filterValue}
                      onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                      placeholder="Filtrer..."
                      className="h-7 w-full rounded border border-border bg-background pl-7 pr-2 text-[11px] focus:border-foreground/30 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="my-1 border-t border-border" />

                {/* Hide */}
                <button onClick={() => { header.column.toggleVisibility(false); setColumnMenu(null); }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/30">
                  <EyeOff className="h-3 w-3" /> Masquer la colonne
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Resize handle */}
      {header.column.getCanResize() && (
        <div
          onMouseDown={header.getResizeHandler()}
          onTouchStart={header.getResizeHandler()}
          className={cn(
            "absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none",
            header.column.getIsResizing() ? "bg-foreground/20" : "hover:bg-foreground/10",
          )}
        />
      )}
    </th>
  );
}
