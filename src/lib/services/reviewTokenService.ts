import { randomUUID } from "crypto";
import * as reviewTokenRepository from "@/lib/repositories/reviewTokenRepository";
import type {
  CreateReviewTokenInput,
  ReviewToken,
  ReviewTokenPublicView,
} from "@/lib/types/ReviewToken";

/** Token validity period in milliseconds — 30 days. */
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Creates a new one-time review invitation token for a client.
 *
 * Generates a UUID token, sets a 30-day expiry, persists to DynamoDB,
 * and returns the token value together with the full shareable URL.
 */
export async function createToken(
  input: CreateReviewTokenInput
): Promise<{ token: string; url: string }> {
  if (!input.clientName.trim()) {
    throw new Error("El nombre del cliente es requerido");
  }

  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS);

  const record: ReviewToken = {
    token,
    clientName: input.clientName.trim(),
    used: false,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await reviewTokenRepository.create(record);

  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://mixtranrevestimientos.com";
  const url = `${base}/resena/${token}`;

  return { token, url };
}

/**
 * Validates a token and returns its public-safe view.
 *
 * Throws one of three sentinel error messages:
 * - `"TOKEN_NOT_FOUND"` — token does not exist in DynamoDB
 * - `"TOKEN_USED"` — token has already been submitted
 * - `"TOKEN_EXPIRED"` — token has passed its 30-day expiry
 */
export async function getTokenForClient(
  token: string
): Promise<ReviewTokenPublicView> {
  const record = await reviewTokenRepository.findByToken(token);

  if (!record) throw new Error("TOKEN_NOT_FOUND");
  if (record.used) throw new Error("TOKEN_USED");
  if (new Date() > new Date(record.expiresAt)) throw new Error("TOKEN_EXPIRED");

  return {
    clientName: record.clientName,
    used: record.used,
    expiresAt: record.expiresAt,
  };
}

/**
 * Marks a token as used after the client successfully submits their review.
 *
 * Re-validates the token before marking to guard against double-submission.
 * Throws `"TOKEN_NOT_FOUND"` or `"TOKEN_USED"` if the token is no longer valid.
 */
export async function consumeToken(token: string): Promise<void> {
  const record = await reviewTokenRepository.findByToken(token);

  if (!record) throw new Error("TOKEN_NOT_FOUND");
  if (record.used) throw new Error("TOKEN_USED");

  await reviewTokenRepository.markUsed(token);
}
