"use client";

import Link from "next/link";
import type { Quote } from "@/lib/types/Quote";
import { QuoteStatusBadge } from "./QuoteStatusBadge";

interface QuoteCardProps {
  quote: Quote;
  className?: string;
}

/** Mobile card for the quote list. Desktop uses a table row in QuoteList. */
export function QuoteCard({ quote, className = "" }: QuoteCardProps) {
  const date = new Date(quote.createdAt).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const total = `${quote.currency.symbol}${quote.total.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 shadow-sm space-y-2 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-primary">{quote.quoteNumber}</p>
          <p className="text-sm text-text-primary">{quote.clientName}</p>
          {quote.clientCompany && (
            <p className="text-xs text-text-muted">{quote.clientCompany}</p>
          )}
        </div>
        <QuoteStatusBadge status={quote.status} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-text-primary">{total}</span>
        <span className="text-xs text-text-muted">{date}</span>
      </div>

      <Link
        href={`/dashboard/quotes/${quote.quoteId}`}
        className="mt-1 block w-full rounded-lg border border-primary px-3 py-2 text-center text-sm font-medium text-primary hover:bg-primary hover:text-on-primary transition-colors min-h-[44px] leading-[28px]"
      >
        Ver cotización
      </Link>
    </div>
  );
}
