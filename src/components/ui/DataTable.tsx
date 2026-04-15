"use client";

import React from "react";

/**
 * Column definition for DataTable.
 * @template T - the row data type.
 */
export interface ColumnDef<T> {
  /** Unique column key — used as React `key` prop. */
  key: string;
  /** Column header label. */
  header: string;
  /**
   * Small-screen grid behaviour: when set to 2 the cell spans both columns.
   * Has no effect on large screens (flex row).
   */
  span?: 2;
  /**
   * On large screens, pushes this cell to the far right of the flex row.
   * Use for action columns.
   */
  align?: "right";
  /** Returns the cell content for a given row. */
  render: (row: T) => React.ReactNode;
  /** Extra className applied to the cell wrapper `<div>` in both layouts. */
  className?: string;
}

/**
 * Props for DataTable.
 * @template T - the row data type.
 */
export interface DataTableProps<T> {
  /** Column definitions in display order. */
  columns: ColumnDef<T>[];
  /** Array of data rows. */
  rows: T[];
  /** Returns a stable string key for each row. */
  getRowKey: (row: T) => string;
  /** Optional click handler — makes rows appear interactive. */
  onRowClick?: (row: T) => void;
  /** Message shown when `rows` is empty. */
  emptyMessage?: string;
  /** Extra className applied to the outermost wrapper. */
  className?: string;
}

const ROW_INTERACTIVE = "cursor-pointer transition-colors hover:bg-background/60";

/**
 * Dual-layout data list.
 *
 * - **Large screens (lg+):** horizontal flex row inside a bordered container,
 *   with a sticky header row. Columns with `align: "right"` are pushed to the
 *   far right with `ml-auto`.
 *
 * - **Small/medium (<lg):** each row is a card with a 2-column grid.
 *   Columns with `span: 2` span the full width. Each cell shows its header
 *   as a small label above the value.
 *
 * Stateless — contains zero business logic.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyMessage = "No hay registros.",
  className = "",
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface py-10 text-center text-sm text-text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={className}>
      {/* ── Large screen: flex table ───────────────────────────────────── */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-surface shadow-card lg:block">
        {/* Header row */}
        <div className="flex items-center gap-4 border-b border-border bg-background px-4 py-3">
          {columns.map((col) => (
            <div
              key={col.key}
              className={[
                "min-w-0 text-xs font-semibold uppercase tracking-wide text-text-muted",
                col.align === "right" ? "ml-auto flex-none" : "flex-1",
                col.className ?? "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {col.header}
            </div>
          ))}
        </div>

        {/* Data rows */}
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={[
                "flex items-center gap-4 px-4 py-3",
                onRowClick ? ROW_INTERACTIVE : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  className={[
                    "min-w-0 text-sm text-text-secondary",
                    col.align === "right" ? "ml-auto flex-none" : "flex-1",
                    col.className ?? "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {col.render(row)}
                </div>
              ))}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Small / medium: card grid ──────────────────────────────────── */}
      <ul className="space-y-3 lg:hidden">
        {rows.map((row) => (
          <li
            key={getRowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={[
              "grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-border bg-surface p-4 shadow-card",
              onRowClick ? ROW_INTERACTIVE : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {columns.map((col) => (
              <div
                key={col.key}
                className={[
                  col.span === 2 ? "col-span-2" : "",
                  col.className ?? "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                  {col.header}
                </p>
                <div className="mt-1 text-sm text-text-secondary">
                  {col.render(row)}
                </div>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** @deprecated No longer used — DataTable hides/shows layouts via responsive classes. */
export type HideBelow = "sm" | "md" | "lg";
