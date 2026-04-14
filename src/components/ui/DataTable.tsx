"use client";

import React from "react";

/** Responsive breakpoint below which a column is hidden. */
export type HideBelow = "sm" | "md" | "lg";

/**
 * Column definition for DataTable.
 * @template T - the row data type.
 */
export interface ColumnDef<T> {
  /** Unique column key — used as React `key` prop. */
  key: string;
  /** Column header label (shown in thead). */
  header: string;
  /**
   * Hides the column at viewports narrower than this breakpoint.
   * Undefined = always visible.
   */
  hideBelow?: HideBelow;
  /** Returns the cell content for a given row. */
  render: (row: T) => React.ReactNode;
  /** Extra className applied to both `<th>` and `<td>` for this column. */
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
  /** Extra className applied to the outer wrapper `<div>`. */
  className?: string;
}

/**
 * Full class strings kept as literals so Tailwind v4 scanner picks them up.
 * Maps a hideBelow value to the Tailwind visibility classes.
 */
const HIDE_BELOW_CLS: Record<HideBelow, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

/**
 * Responsive data table primitive.
 *
 * Columns with `hideBelow` are hidden at smaller breakpoints to prevent
 * horizontal overflow. The table always fills its container width.
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
    <div
      className={`w-full overflow-hidden rounded-lg border border-border bg-surface shadow-card ${className}`}
    >
      <table className="w-full divide-y divide-border text-sm">
        <thead className="bg-background">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted",
                  col.hideBelow ? HIDE_BELOW_CLS[col.hideBelow] : "",
                  col.className ?? "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={[
                "transition-colors hover:bg-background/50",
                onRowClick ? "cursor-pointer" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    "px-4 py-3 text-text-secondary",
                    col.hideBelow ? HIDE_BELOW_CLS[col.hideBelow] : "",
                    col.className ?? "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
