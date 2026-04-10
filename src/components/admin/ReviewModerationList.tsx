"use client";

import { useState } from "react";
import { ReviewModerationCard } from "@/components/admin/ReviewModerationCard";
import type { Review } from "@/lib/types/Review";

/** Props for ReviewModerationList. */
export interface ReviewModerationListProps {
  /** Initial list of reviews passed from the server component. */
  reviews: Review[];
}

/**
 * Client wrapper that manages the local review list state after moderation actions.
 * Updates the status of a card in-place without a full page reload.
 */
export function ReviewModerationList({ reviews: initialReviews }: ReviewModerationListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  function handleStatusChange(reviewId: string, status: "approved" | "rejected") {
    setReviews((prev) =>
      /* For delete actions (status="rejected" from the delete handler), remove the card. */
      prev
        .map((r) => (r.reviewId === reviewId ? { ...r, status } : r))
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface py-10 text-center text-sm text-text-muted">
        No hay reseñas registradas.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {reviews.map((review) => (
        <ReviewModerationCard
          key={review.reviewId}
          review={review}
          onStatusChange={handleStatusChange}
        />
      ))}
    </div>
  );
}
