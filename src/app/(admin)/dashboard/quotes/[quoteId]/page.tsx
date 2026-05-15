import { notFound } from "next/navigation";
import Link from "next/link";
import * as quoteService from "@/lib/services/quoteService";
import { QuoteStatusBadge } from "@/components/admin/quotes/QuoteStatusBadge";
import { QuoteDetailActions } from "@/components/admin/quotes/QuoteDetailActions";

export const metadata = { title: "Cotización — Administración" };

interface Props {
  params: Promise<{ quoteId: string }>;
}

/** /dashboard/quotes/[quoteId] — Vista de detalle de una cotización. */
export default async function QuoteDetailPage({ params }: Props) {
  const { quoteId } = await params;

  let quote;
  try {
    quote = await quoteService.getQuote(quoteId);
  } catch {
    notFound();
  }

  const sym = quote.currency.symbol;
  const fmt = (n: number) =>
    `${sym}${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary">{quote.quoteNumber}</h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="text-sm text-text-muted">Creada el {fmtDate(quote.createdAt)}</p>
        </div>
        <Link
          href="/dashboard/quotes"
          className="text-sm text-text-muted hover:text-primary"
        >
          ← Todas las cotizaciones
        </Link>
      </div>

      {/* Client info */}
      <section className="rounded-xl border border-border bg-surface p-4 space-y-1">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
          Cliente
        </p>
        <p className="text-sm font-semibold text-text-primary">{quote.clientName}</p>
        {quote.clientCompany && (
          <p className="text-sm text-text-muted">{quote.clientCompany}</p>
        )}
        {quote.clientTaxId && (
          <p className="text-sm text-text-muted">RFC/RIF: {quote.clientTaxId}</p>
        )}
        {quote.clientPhone && (
          <p className="text-sm text-text-muted">Tel: {quote.clientPhone}</p>
        )}
        {quote.clientEmail && (
          <p className="text-sm text-text-muted">{quote.clientEmail}</p>
        )}
        {quote.clientAddress && (
          <p className="text-sm text-text-muted">{quote.clientAddress}</p>
        )}
      </section>

      {/* Items */}
      <section className="rounded-xl border border-border bg-surface divide-y divide-border">
        <p className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wide">
          Productos y servicios
        </p>
        {quote.items.map((item) => (
          <div key={item.lineId} className="px-4 py-3 flex justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">{item.name}</p>
              {item.description && (
                <p className="text-xs text-text-muted">{item.description}</p>
              )}
              <p className="text-xs text-text-muted">
                {item.quantity} {item.unit} × {fmt(item.unitPrice)}
                {item.discountPercent > 0 && ` · -${item.discountPercent}%`}
              </p>
            </div>
            <span className="text-sm font-semibold text-text-primary whitespace-nowrap">
              {fmt(item.lineTotal)}
            </span>
          </div>
        ))}

        {/* Totals */}
        <div className="px-4 py-3 space-y-1">
          <div className="flex justify-between text-sm text-text-muted">
            <span>Subtotal</span>
            <span>{fmt(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-text-muted">
            <span>IVA ({quote.ivaPercent}%)</span>
            <span>{fmt(quote.ivaAmount)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold border-t border-border pt-2">
            <span>Total ({quote.currency.code})</span>
            <span className="text-primary">{fmt(quote.total)}</span>
          </div>
        </div>
      </section>

      {/* Validity */}
      <p className="text-sm text-text-muted">
        Válida hasta:{" "}
        <span className="text-text-primary font-medium">{fmtDate(quote.validUntil)}</span>
      </p>

      {/* Notes */}
      {quote.notes && (
        <section className="rounded-xl border border-border bg-surface p-4 space-y-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Notas</p>
          <p className="text-sm text-text-primary whitespace-pre-line">{quote.notes}</p>
        </section>
      )}

      {/* PDF info */}
      {quote.pdfGeneratedAt && (
        <p className="text-xs text-text-muted">
          PDF generado el {fmtDate(quote.pdfGeneratedAt)}
        </p>
      )}

      {/* Action bar — sticky on mobile, inline on desktop */}
      <QuoteDetailActions quote={quote} />
    </div>
  );
}
