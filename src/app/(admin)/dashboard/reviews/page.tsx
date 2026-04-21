import * as reviewService from "@/lib/services/reviewService";
import { ReviewModerationList } from "@/components/admin/ReviewModerationList";
import { CreateReviewLinkButton } from "@/components/admin/CreateReviewLinkButton";
import type { Review } from "@/lib/types/Review";

/**
 * Admin reviews moderation page — /dashboard/reviews.
 *
 * Loads all reviews and passes them to the ReviewModerationList client component.
 * Server Component — data fetched at request time.
 */
export default async function ReviewsPage() {
  const allReviews = await reviewService.getAllReviews().catch((err) => {
    console.error("ReviewsPage: failed to load reviews —", err?.message);
    return [] as Review[];
  });

  const pending  = allReviews.filter((r) => r.status === "pending");
  const approved = allReviews.filter((r) => r.status === "approved");
  const rejected = allReviews.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="font-heading text-3xl font-bold text-text-primary">Reseñas</h1>
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
          <CreateReviewLinkButton />
          <div className="flex gap-3 text-sm">
            <Pill label="Pendientes" count={pending.length} cls="bg-warning/10 text-warning" />
            <Pill label="Aprobadas"  count={approved.length} cls="bg-success/10 text-success" />
            <Pill label="Rechazadas" count={rejected.length} cls="bg-danger/10 text-danger" />
          </div>
        </div>
      </div>

      {/* Pending first — these need immediate attention. */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-4 font-semibold text-text-primary">
            Pendientes de revisión ({pending.length})
          </h2>
          <ReviewModerationList reviews={pending} />
        </section>
      )}

      {approved.length > 0 && (
        <section>
          <h2 className="mb-4 font-semibold text-text-primary">
            Aprobadas ({approved.length})
          </h2>
          <ReviewModerationList reviews={approved} />
        </section>
      )}

      {rejected.length > 0 && (
        <section>
          <h2 className="mb-4 font-semibold text-text-primary">
            Rechazadas ({rejected.length})
          </h2>
          <ReviewModerationList reviews={rejected} />
        </section>
      )}

      {allReviews.length === 0 && (
        <p className="rounded-lg border border-border bg-surface py-12 text-center text-sm text-text-muted">
          No hay reseñas registradas todavía.
        </p>
      )}
    </div>
  );
}

/** Compact count pill. */
function Pill({ label, count, cls }: { label: string; count: number; cls: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      <span className="font-bold">{count}</span> {label}
    </span>
  );
}
