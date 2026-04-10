import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import * as reviewRepository from "@/lib/repositories/reviewRepository";
import type { Review, CreateReviewInput } from "@/lib/types/Review";

/**
 * Returns all approved reviews sorted newest-first.
 * Called from the landing page (ISR) and the admin dashboard.
 */
export async function getApprovedReviews(): Promise<Review[]> {
  return reviewRepository.findByStatus("approved");
}

/**
 * Returns all pending reviews sorted newest-first.
 * Used by the admin moderation queue.
 */
export async function getPendingReviews(): Promise<Review[]> {
  return reviewRepository.findByStatus("pending");
}

/**
 * Returns all reviews regardless of status for the admin overview.
 */
export async function getAllReviews(): Promise<Review[]> {
  const [pending, approved, rejected] = await Promise.all([
    reviewRepository.findByStatus("pending"),
    reviewRepository.findByStatus("approved"),
    reviewRepository.findByStatus("rejected"),
  ]);
  /* Merge and sort by createdAt descending. */
  return [...pending, ...approved, ...rejected].sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt)
  );
}

/**
 * Submits a new review from the public page.
 * Always starts with status="pending" — requires admin approval before appearing on landing.
 */
export async function submitReview(input: CreateReviewInput): Promise<Review> {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("reviewService.submitReview: rating must be between 1 and 5");
  }
  if (!input.body.trim()) {
    throw new Error("reviewService.submitReview: body is required");
  }

  const review: Review = {
    reviewId: randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
    authorName: input.authorName.trim(),
    body: input.body.trim(),
    rating: input.rating,
    ...(input.email ? { contactEmail: input.email } : {}),
    ...(input.phone ? { phone: input.phone.trim() } : {}),
  };

  await reviewRepository.create(review);
  return review;
}

/**
 * Approves a review, making it visible on the landing page.
 * Triggers ISR revalidation of the landing so the new review appears immediately.
 */
export async function approveReview(reviewId: string): Promise<void> {
  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new Error(`reviewService.approveReview: not found — ${reviewId}`);

  await reviewRepository.updateStatus(reviewId, "approved", review.contactEmail);
  /* Regenerate the landing page so the approved review appears within seconds. */
  revalidatePath("/");
}

/**
 * Rejects a review, hiding it from the landing page.
 * If the review was previously approved, also revalidates the landing.
 */
export async function rejectReview(reviewId: string): Promise<void> {
  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new Error(`reviewService.rejectReview: not found — ${reviewId}`);

  const wasApproved = review.status === "approved";
  await reviewRepository.updateStatus(reviewId, "rejected");

  if (wasApproved) revalidatePath("/");
}

/**
 * Permanently deletes a review. Admin only.
 * Revalidates landing if the review was approved.
 */
export async function deleteReview(reviewId: string): Promise<void> {
  const review = await reviewRepository.findById(reviewId);
  if (!review) throw new Error(`reviewService.deleteReview: not found — ${reviewId}`);

  const wasApproved = review.status === "approved";
  await reviewRepository.remove(reviewId);

  if (wasApproved) revalidatePath("/");
}
