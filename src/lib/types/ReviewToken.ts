/**
 * Represents a one-time review invitation token.
 * Stored in the `paint-review-tokens` DynamoDB table (PK: `token`).
 *
 * A token is created by an admin for a specific client. The client
 * opens the unique link, fills out the review form, and submits.
 * On submission the token is marked `used: true` so it cannot be
 * filled again.
 */
export interface ReviewToken {
  /** UUID primary key. Embedded in the shareable URL. */
  token: string;
  /** Display name of the client the link was created for. */
  clientName: string;
  /** false on creation; set to true once the review has been submitted. */
  used: boolean;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** ISO 8601 expiry timestamp — 30 days from createdAt. */
  expiresAt: string;
}

/** Input required to create a new review invitation token. */
export interface CreateReviewTokenInput {
  /** Name of the client who will receive the link. */
  clientName: string;
}

/**
 * Public-safe projection of a ReviewToken.
 * Returned by GET /api/review-tokens/[token] — excludes the raw token
 * value and other internal fields.
 */
export interface ReviewTokenPublicView {
  /** Display name to pre-fill in the review form. */
  clientName: string;
  /** Whether the token has already been used. */
  used: boolean;
  /** ISO 8601 expiry timestamp. */
  expiresAt: string;
}
