"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Quote, QuoteStatus } from "@/lib/types/Quote";
import { QuoteCard } from "./QuoteCard";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { QuoteFilterBar, type QuoteFilters } from "./QuoteFilterBar";

/** Reads draft from localStorage with fallback. */
function readDraft<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const EMPTY_FILTERS: QuoteFilters = { status: "", search: "", from: "", to: "" };

/**
 * Quote list with mobile card layout and desktop table.
 * Filters sync to URL query params.
 */
export function QuoteList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<QuoteFilters>(() => ({
    status: (searchParams.get("status") as QuoteStatus | "") ?? "",
    search: searchParams.get("search") ?? "",
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
  }));

  const fetchQuotes = useCallback(async (f: QuoteFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (f.status) params.set("status", f.status);
      if (f.search) params.set("search", f.search);
      if (f.from) params.set("from", f.from);
      if (f.to) params.set("to", f.to);

      const res = await fetch(`/api/quotes?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setQuotes(json.data);
      } else {
        setError(json.error ?? "Error desconocido");
      }
    } catch {
      setError("Error al cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuotes(filters);
    /* Sync to URL. */
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    router.replace(`/dashboard/quotes?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  function handleFilterChange(f: QuoteFilters) {
    setFilters(f);
  }

  const fmtTotal = (q: Quote) =>
    `${q.currency.symbol}${q.total.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="space-y-4">
      <QuoteFilterBar filters={filters} onChange={handleFilterChange} />

      {loading && (
        <p className="text-center text-text-muted py-8">Cargando cotizaciones…</p>
      )}

      {error && (
        <p className="rounded-lg bg-danger/10 text-danger px-4 py-3 text-sm">{error}</p>
      )}

      {!loading && !error && quotes.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-text-muted">No hay cotizaciones que coincidan.</p>
          <Link
            href="/dashboard/quotes/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-secondary transition-colors min-h-[44px] flex items-center"
          >
            Crear primera cotización
          </Link>
        </div>
      )}

      {/* Mobile: card stack */}
      {!loading && quotes.length > 0 && (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {quotes.map((q) => (
              <QuoteCard key={q.quoteId} quote={q} />
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-text-muted text-left">
                  <th className="px-4 py-3 font-medium">Folio</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.quoteId}
                    className="border-b border-border last:border-0 hover:bg-background/50"
                  >
                    <td className="px-4 py-3 font-medium text-primary">{q.quoteNumber}</td>
                    <td className="px-4 py-3">
                      <div>{q.clientName}</div>
                      {q.clientCompany && (
                        <div className="text-xs text-text-muted">{q.clientCompany}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fmtTotal(q)}</td>
                    <td className="px-4 py-3">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {new Date(q.createdAt).toLocaleDateString("es-MX")}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/quotes/${q.quoteId}`}
                        className="text-primary hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
