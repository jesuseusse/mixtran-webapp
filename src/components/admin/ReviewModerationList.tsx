"use client";

import { useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Rating } from "@/components/ui/Rating";
import { Spinner } from "@/components/ui/Spinner";
import type { Review } from "@/lib/types/Review";

/** Props for ReviewModerationList. */
export interface ReviewModerationListProps {
  /** Initial list of reviews passed from the server component. */
  reviews: Review[];
}

/**
 * Admin review moderation table.
 *
 * Displays reviews in a responsive table and lets the admin approve,
 * reject, or delete each one. On small screens only author, rating and
 * status are shown.
 */
export function ReviewModerationList({ reviews: initialReviews }: ReviewModerationListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [processing, setProcessing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleAction(
    reviewId: string,
    action: "approved" | "rejected" | "delete"
  ) {
    setProcessing(reviewId);
    setErrors((prev) => ({ ...prev, [reviewId]: "" }));
    try {
      const url = `/api/reviews/${reviewId}`;
      const res = await fetch(url, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: action !== "delete" ? { "Content-Type": "application/json" } : undefined,
        body: action !== "delete" ? JSON.stringify({ status: action }) : undefined,
      });
      const json = await res.json();

      if (json.success) {
        if (action === "delete") {
          /* Remove from list entirely. */
          setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
        } else {
          setReviews((prev) =>
            prev.map((r) => (r.reviewId === reviewId ? { ...r, status: action } : r))
          );
        }
      } else {
        setErrors((prev) => ({ ...prev, [reviewId]: json.error ?? "Error al procesar" }));
      }
    } catch {
      setErrors((prev) => ({ ...prev, [reviewId]: "Error de conexión" }));
    } finally {
      setProcessing(null);
    }
  }

  const columns: ColumnDef<Review>[] = [
    {
      key: "author",
      header: "Autor",
      render: (r) => (
        <div>
          <p className="font-medium text-text-primary">{r.authorName}</p>
          {r.contactEmail && (
            <p className="text-xs text-text-muted">{r.contactEmail}</p>
          )}
        </div>
      ),
    },
    {
      key: "rating",
      header: "Puntuación",
      render: (r) => <Rating value={r.rating} size="sm" />,
    },
    {
      key: "body",
      header: "Reseña",
      hideBelow: "md",
      className: "max-w-xs",
      render: (r) => (
        <p className="line-clamp-2 text-xs text-text-secondary">{r.body}</p>
      ),
    },
    {
      key: "phone",
      header: "Teléfono",
      hideBelow: "lg",
      render: (r) => r.phone ?? "—",
    },
    {
      key: "createdAt",
      header: "Fecha",
      hideBelow: "sm",
      render: (r) =>
        new Date(r.createdAt).toLocaleDateString("es-VE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "status",
      header: "Estado",
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (r) => (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {r.status !== "approved" && (
              <ActionButton
                onClick={() => handleAction(r.reviewId, "approved")}
                disabled={processing === r.reviewId}
                variant="approve"
              >
                {processing === r.reviewId ? <Spinner size="sm" /> : null}
                Aprobar
              </ActionButton>
            )}
            {r.status !== "rejected" && (
              <ActionButton
                onClick={() => handleAction(r.reviewId, "rejected")}
                disabled={processing === r.reviewId}
                variant="reject"
              >
                Rechazar
              </ActionButton>
            )}
            <ActionButton
              onClick={() => handleAction(r.reviewId, "delete")}
              disabled={processing === r.reviewId}
              variant="delete"
            >
              Eliminar
            </ActionButton>
          </div>
          {errors[r.reviewId] && (
            <p className="text-xs text-danger">{errors[r.reviewId]}</p>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={reviews}
      getRowKey={(r) => r.reviewId}
      emptyMessage="No hay reseñas registradas."
    />
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
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-opacity disabled:opacity-60 ${cls[variant]}`}
    >
      {children}
    </button>
  );
}
