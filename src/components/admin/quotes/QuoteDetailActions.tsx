"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Quote, QuoteStatus } from "@/lib/types/Quote";

const STATUS_OPTIONS: { value: QuoteStatus; label: string }[] = [
  { value: "sent", label: "Enviada" },
  { value: "accepted", label: "Aceptada" },
  { value: "rejected", label: "Rechazada" },
  { value: "expired", label: "Expirada" },
  { value: "draft", label: "Borrador" },
];

interface QuoteDetailActionsProps {
  quote: Quote;
}

/** Sticky action bar for the quote detail page. */
export function QuoteDetailActions({ quote }: QuoteDetailActionsProps) {
  const router = useRouter();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const pdfDisabled = quote.status === "draft";

  async function handleStatusChange(status: QuoteStatus) {
    setStatusLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quote.quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Error al cambiar el estado");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleGeneratePdf() {
    setPdfLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quote.quoteId}/pdf`, { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Error al generar el PDF");
        return;
      }
      const url = (json.data as { url: string }).url;
      setPdfUrl(url);
      window.open(url, "_blank");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quote.quoteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Error al eliminar");
        return;
      }
      router.push("/dashboard/quotes");
    } catch {
      setError("Error de conexión");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <>
      {error && (
        <p className="rounded-lg bg-danger/10 text-danger px-4 py-3 text-sm">{error}</p>
      )}

      {/* Sticky action bar — fixed on mobile, static on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface p-4 flex flex-wrap gap-2 md:static md:border-0 md:p-0 md:bg-transparent">
        {/* Status dropdown */}
        <select
          value={quote.status}
          onChange={(e) => handleStatusChange(e.target.value as QuoteStatus)}
          disabled={statusLoading}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] disabled:opacity-50"
          aria-label="Cambiar estado"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* PDF button */}
        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-on-success hover:bg-success/80 transition-colors min-h-[44px] flex items-center"
          >
            Descargar PDF
          </a>
        ) : (
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={pdfDisabled || pdfLoading}
            title={pdfDisabled ? "Cambia el estado a enviada para generar el PDF" : undefined}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent/80 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfLoading ? "Generando…" : "Generar PDF"}
          </button>
        )}

        {/* Edit */}
        <Link
          href={`/dashboard/quotes/new?edit=${quote.quoteId}`}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:border-primary transition-colors min-h-[44px] flex items-center"
        >
          Editar
        </Link>

        {/* Delete */}
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="rounded-lg border border-danger px-4 py-2 text-sm text-danger hover:bg-danger hover:text-on-danger transition-colors min-h-[44px]"
        >
          Eliminar
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="rounded-xl bg-surface border border-border p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h2 className="text-base font-semibold text-text-primary">
              ¿Eliminar {quote.quoteNumber}?
            </h2>
            <p className="text-sm text-text-muted">
              Esta acción no se puede deshacer. La cotización se eliminará permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-on-danger hover:bg-danger/80 transition-colors min-h-[44px] disabled:opacity-50"
              >
                {deleteLoading ? "Eliminando…" : "Sí, eliminar"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm text-text-secondary min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
