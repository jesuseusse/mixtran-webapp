"use client";

import { useState } from "react";
import type { QuoteStatus } from "@/lib/types/Quote";

const STATUS_OPTIONS: { value: QuoteStatus | ""; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "draft", label: "Borrador" },
  { value: "sent", label: "Enviada" },
  { value: "accepted", label: "Aceptada" },
  { value: "rejected", label: "Rechazada" },
  { value: "expired", label: "Expirada" },
];

export interface QuoteFilters {
  status: QuoteStatus | "";
  search: string;
  from: string;
  to: string;
}

interface QuoteFilterBarProps {
  filters: QuoteFilters;
  onChange: (filters: QuoteFilters) => void;
  className?: string;
}

/**
 * Filter bar for the quote list. Pill buttons for status, text search, and date range.
 * Date range is behind a toggle on mobile.
 */
export function QuoteFilterBar({ filters, onChange, className = "" }: QuoteFilterBarProps) {
  const [showDates, setShowDates] = useState(false);

  function set(partial: Partial<QuoteFilters>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status pills */}
      <div
        className="flex flex-wrap gap-2"
        style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => set({ status: opt.value })}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors min-h-[44px] min-w-[44px] ${
              filters.status === opt.value
                ? "bg-primary text-on-primary"
                : "bg-surface text-text-secondary border border-border hover:border-primary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search + date toggle */}
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Buscar por folio o cliente…"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
        />
        <button
          type="button"
          onClick={() => setShowDates((v) => !v)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary hover:border-primary min-h-[44px] min-w-[44px]"
          aria-expanded={showDates}
        >
          Filtros
        </button>
      </div>

      {/* Date range — hidden behind toggle on mobile */}
      {showDates && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-text-muted">Desde</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => set({ from: e.target.value })}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs text-text-muted">Hasta</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => set({ to: e.target.value })}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            />
          </label>
        </div>
      )}
    </div>
  );
}
