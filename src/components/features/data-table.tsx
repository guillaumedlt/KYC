"use client";

import { useState } from "react";
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
  EyeOff, SlidersHorizontal, Filter, ChevronDown, GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  data: T[];
  searchPlaceholder?: string;
}

export function DataTable<T>({ columns, data, searchPlaceholder = "Filtrer..." }: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnMenu, setColumnMenu] = useState<string | null>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

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

  // Drag reorder via grip icon only
  function handleDragStart(e: React.DragEvent, colId: string) {
    setDraggedCol(colId);
    e.dataTransfer.effectAllowed = "move";
  }
  function handleDragOverCol(e: React.DragEvent, colId: string) {
    e.preventDefault();
    if (draggedCol && draggedCol !== colId) setDragOverCol(colId);
  }
  function handleDragLeave() { setDragOverCol(null); }
  function handleDrop(targetColId: string) {
    if (!draggedCol || draggedCol === targetColId) { setDraggedCol(null); setDragOverCol(null); return; }
    const currentOrder = columnOrder.length ? [...columnOrder] : table.getAllLeafColumns().map((c) => c.id);
    const fromIdx = currentOrder.indexOf(draggedCol);
    const toIdx = currentOrder.indexOf(targetColId);
    currentOrder.splice(fromIdx, 1);
    currentOrder.splice(toIdx, 0, draggedCol);
    setColumnOrder(currentOrder);
    setDraggedCol(null);
    setDragOverCol(null);
  }
  function handleDragEnd() { setDraggedCol(null); setDragOverCol(null); }

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

        {/* Column visibility */}
        <div className="relative">
          <button onClick={() => setColumnMenu(columnMenu === "__cols" ? null : "__cols")}
            className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
            <SlidersHorizontal className="h-3 w-3" />
            <span className="hidden sm:inline">Colonnes</span>
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

        <span className="shrink-0 font-data text-[11px] text-muted-foreground">{table.getFilteredRowModel().rows.length}</span>
      </div>

      {/* Table — w-full forces columns to fill space */}
      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full min-w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "group relative px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground",
                      dragOverCol === header.column.id && "bg-muted/30",
                      draggedCol === header.column.id && "opacity-40",
                    )}
                    style={{ width: header.getSize(), minWidth: 60 }}
                    onDragOver={(e) => handleDragOverCol(e, header.column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(header.column.id)}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-0.5">
                        {/* Drag grip — separate from resize */}
                        <span
                          draggable
                          onDragStart={(e) => handleDragStart(e, header.column.id)}
                          onDragEnd={handleDragEnd}
                          className="mr-1 cursor-grab opacity-0 transition-opacity group-hover:opacity-40 hover:!opacity-100 active:cursor-grabbing"
                        >
                          <GripVertical className="h-3 w-3" />
                        </span>

                        {/* Sort click */}
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

                        {/* Column menu */}
                        <button
                          onClick={() => setColumnMenu(columnMenu === header.column.id ? null : header.column.id)}
                          className={cn(
                            "ml-auto rounded p-0.5 transition-opacity hover:bg-muted/30 hover:text-foreground",
                            columnMenu === header.column.id || header.column.getFilterValue() ? "opacity-100" : "opacity-0 group-hover:opacity-60",
                          )}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>

                        {/* Dropdown */}
                        {columnMenu === header.column.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setColumnMenu(null)} />
                            <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-card p-1 shadow-lg">
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
                              <div className="px-2 py-1">
                                <div className="relative">
                                  <Filter className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                  <input
                                    value={(header.column.getFilterValue() as string) ?? ""}
                                    onChange={(e) => header.column.setFilterValue(e.target.value || undefined)}
                                    placeholder="Filtrer..."
                                    className="h-7 w-full rounded border border-border bg-background pl-7 pr-2 text-[11px] focus:border-foreground/30 focus:outline-none"
                                    autoFocus
                                  />
                                </div>
                              </div>
                              <div className="my-1 border-t border-border" />
                              <button onClick={() => { header.column.toggleVisibility(false); setColumnMenu(null); }}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted/30">
                                <EyeOff className="h-3 w-3" /> Masquer
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Resize handle — right edge only, distinct cursor */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "absolute right-0 top-0 h-full w-[3px] cursor-col-resize select-none touch-none transition-colors",
                          header.column.getIsResizing() ? "bg-foreground/30" : "hover:bg-foreground/15",
                        )}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={visibleCount} className="px-4 py-10 text-center text-[12px] text-muted-foreground">Aucun résultat</td></tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="group border-b border-border/50 transition-colors last:border-0 hover:bg-muted/15">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2.5" style={{ width: cell.column.getSize(), minWidth: 60 }}>
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
