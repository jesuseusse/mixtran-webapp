"use client";

import { useState } from "react";
import { Rating } from "@/components/ui/Rating";
import { Spinner } from "@/components/ui/Spinner";
import type { Review } from "@/lib/types/Review";

/** Props for ReviewModerationCard. */
export interface ReviewModerationCardProps {
  review: Review;
  /** Called after a successful status change so the parent can remove/update the card. */
  onStatusChange: (reviewId: string, status: "approved" | "rejected") => void;
}

/**
 * Admin review moderation card.
 *
 * Displays review content and lets the admin approve, reject, or delete.
 * Calls PATCH /api/reviews/[id] and DELETE /api/reviews/[id].
 */
export function ReviewModerationCard({ review, onStatusChange }: ReviewModerationCardProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function handleAction(action: "approved" | "rejected" | "delete") {
    setProcessing(true);
    setError("");
    try {
      const url = `/api/reviews/${review.reviewId}`;
      const res = await fetch(url, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: action !== "delete" ? { "Content-Type": "application/json" } : undefined,
        body: action !== "delete" ? JSON.stringify({ status: action }) : undefined,
      });
      const json = await res.json();

      if (json.success) {
        if (action !== "delete") {
          onStatusChange(review.reviewId, action);
        } else {
          onStatusChange(review.reviewId, "rejected");
        }
      } else {
        setError(json.error ?? "Error al procesar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-card space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-text-primary">{review.authorName}</p>
          {review.contactEmail && (
            <p className="text-xs text-text-muted">{review.contactEmail}</p>
          )}
          {review.phone && (
            <p className="text-xs text-text-muted">📞 {review.phone}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Rating value={review.rating} size="sm" />
          <StatusBadge status={review.status} />
        </div>
      </div>

      {/* Body */}
      <blockquote className="text-sm leading-relaxed text-text-secondary border-l-2 border-accent pl-3">
        &ldquo;{review.body}&rdquo;
      </blockquote>

      {/* Date */}
      <p className="text-xs text-text-muted">
        {new Date(review.createdAt).toLocaleDateString("es-VE", {
          day: "numeric", month: "long", year: "numeric",
        })}
      </p>

      {/* Error */}
      {error && <p className="text-xs text-danger">{error}</p>}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {review.status !== "approved" && (
          <ActionButton
            onClick={() => handleAction("approved")}
            disabled={processing}
            variant="approve"
          >
            {processing ? <Spinner size="sm" /> : null}
            Aprobar
          </ActionButton>
        )}
        {review.status !== "rejected" && (
          <ActionButton
            onClick={() => handleAction("rejected")}
            disabled={processing}
            variant="reject"
          >
            Rechazar
          </ActionButton>
        )}
        <ActionButton
          onClick={() => handleAction("delete")}
          disabled={processing}
          variant="delete"
        >
          Eliminar
        </ActionButton>
      </div>
    </div>
  );
}

/** Status badge with semantic color per review status. */
function StatusBadge({ status }: { status: Review["status"] }) {
  const map: Record<Review["status"], { label: string; cls: string }> = {
    pending:  { label: "Pendiente",  cls: "bg-warning/10 text-warning" },
    approved: { label: "Aprobada",   cls: "bg-success/10 text-success" },
    rejected: { label: "Rechazada",  cls: "bg-danger/10 text-danger" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

/** Small action button with visual variants. */
function ActionButton({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  variant: "approve" | "reject" | "delete";
}) {
  const cls: Record<string, string> = {
    approve: "bg-success text-on-success hover:opacity-90",
    reject:  "bg-warning text-on-warning hover:opacity-90",
    delete:  "border border-danger text-danger hover:bg-danger/10",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded px-3 py-1 text-xs font-medium transition-opacity disabled:opacity-60 ${cls[variant]}`}
    >
      {children}
    </button>
  );
}
