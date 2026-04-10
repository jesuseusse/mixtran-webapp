/**
 * Moderation status of a review.
 * pending  — awaiting admin decision
 * approved — visible on the landing page
 * rejected — hidden from public view
 */
export type ReviewStatus = "pending" | "approved" | "rejected";

/**
 * A customer review submitted via the public /resenas page.
 * Stored in the `paint-reviews` DynamoDB table.
 */
export interface Review {
  /** UUID primary key. */
  reviewId: string;
  /**
   * Moderation status. GSI partition key (`status-createdAt-index`).
   * Only "approved" reviews are rendered on the landing page.
   */
  status: ReviewStatus;
  /** ISO 8601 submission timestamp. GSI sort key — used to order the moderation queue. */
  createdAt: string;
  /** FK to contacts table — set when the author has an existing contact record. */
  contactEmail?: string;
  /** Display name of the reviewer. */
  authorName: string;
  /** Optional phone number provided by the reviewer for follow-up. */
  phone?: string;
  /** Star rating 1–5. */
  rating: number;
  /** Review body text. */
  body: string;
}

/**
 * Input payload for submitting a new review from the public page.
 */
export interface CreateReviewInput {
  authorName: string;
  /** Optional — used to link the review to a contact record. */
  email?: string;
  /** Optional phone number for follow-up. */
  phone?: string;
  rating: number;
  body: string;
}
