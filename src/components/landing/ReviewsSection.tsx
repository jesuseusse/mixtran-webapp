import { Rating } from "@/components/ui";

/** A single customer review card. */
export interface ReviewItem {
  /** Unique identifier for the review. */
  reviewId: string;
  /** Display name of the reviewer. */
  authorName: string;
  /** Star rating 1–5. */
  rating: number;
  /** Review body text. */
  body: string;
  /** ISO 8601 date the review was submitted. */
  createdAt: string;
}

/** Props accepted by ReviewsSection. Matches the Phase 4 DynamoDB content shape. */
export interface ReviewsSectionProps {
  /** Section heading. */
  heading: string;
  /** Supporting subtitle. */
  subtitle?: string;
  /**
   * Approved reviews to display.
   * In Phase 1 this is an empty array (placeholder).
   * In Phase 4 these are fetched from DynamoDB via `reviewService.getApproved()`.
   */
  reviews: ReviewItem[];
}

/**
 * Reviews section — displays approved customer reviews in a card grid.
 *
 * Shows a friendly placeholder when no reviews are available yet (Phase 1).
 * Content is passed as props so Phase 4 can feed it from DynamoDB with
 * zero refactor to this component.
 */
export function ReviewsSection({
  heading,
  subtitle,
  reviews,
}: ReviewsSectionProps) {
  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="bg-surface py-[var(--section-padding-y)] px-[var(--section-padding-x)]"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2
            id="reviews-heading"
            className="mb-4 font-heading text-3xl font-bold text-text-primary sm:text-4xl"
          >
            {heading}
          </h2>
          {subtitle && (
            <p className="mx-auto max-w-2xl text-base text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>

        {reviews.length === 0 ? (
          /* Placeholder — shown in Phase 1 before any reviews are collected */
          <p className="text-center text-text-muted">
            Reseñas próximamente. ¡Sé el primero en compartir tu experiencia!
          </p>
        ) : (
          <ul
            role="list"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {reviews.map((review) => (
              <li
                key={review.reviewId}
                className="rounded-lg border border-border bg-surface p-6 shadow-card"
              >
                {/* Star rating */}
                <Rating value={review.rating} size="sm" className="mb-3" />

                {/* Body */}
                <blockquote className="mb-4 text-sm leading-relaxed text-text-secondary">
                  &ldquo;{review.body}&rdquo;
                </blockquote>

                {/* Attribution */}
                <footer>
                  <cite className="not-italic text-sm font-semibold text-text-primary">
                    {review.authorName}
                  </cite>
                </footer>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
