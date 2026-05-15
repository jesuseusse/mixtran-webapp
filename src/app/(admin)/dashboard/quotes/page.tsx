import { Suspense } from "react";
import Link from "next/link";
import { QuoteList } from "@/components/admin/quotes/QuoteList";

export const metadata = { title: "Cotizaciones — Administración" };

/** /dashboard/quotes — Lista de cotizaciones. */
export default function QuotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Cotizaciones</h1>
          <p className="text-sm text-text-muted">
            Gestiona y da seguimiento a tus cotizaciones.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/quotes/settings"
            className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:border-primary transition-colors min-h-[44px] flex items-center"
          >
            Configuración
          </Link>
          <Link
            href="/dashboard/quotes/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-secondary transition-colors min-h-[44px] flex items-center"
          >
            + Nueva cotización
          </Link>
        </div>
      </div>

      <Suspense fallback={<p className="text-text-muted">Cargando…</p>}>
        <QuoteList />
      </Suspense>
    </div>
  );
}
