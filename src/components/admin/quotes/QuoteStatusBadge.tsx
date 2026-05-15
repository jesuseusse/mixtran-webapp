"use client";

import type { QuoteStatus } from "@/lib/types/Quote";

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  className?: string;
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Expirada",
};

const STATUS_CLASSES: Record<QuoteStatus, string> = {
  draft: "bg-surface text-text-secondary border border-border",
  sent: "bg-info text-on-info",
  accepted: "bg-success text-on-success",
  rejected: "bg-danger text-on-danger",
  expired: "bg-warning text-on-warning",
};

/** Pill badge displaying a quote status in Spanish. */
export function QuoteStatusBadge({ status, className = "" }: QuoteStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
