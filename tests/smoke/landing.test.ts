import { describe, it, expect, vi } from "vitest";

/** Stub the DynamoDB review table so no AWS call is made. */
vi.mock("@/lib/repositories/reviewRepository", () => ({
  findByStatus: vi.fn().mockResolvedValue([
    {
      reviewId: "r-001",
      status: "approved",
      authorName: "Ana López",
      rating: 5,
      body: "Excelente servicio de pintura.",
      createdAt: "2024-03-15T10:00:00Z",
    },
  ]),
  create: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  updateStatus: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
}));

/** reviewService imports revalidatePath at the top level — stub it. */
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import * as reviewService from "@/lib/services/reviewService";

describe("Landing page — happy path", () => {
  it("getApprovedReviews returns approved reviews for display on the landing", async () => {
    const reviews = await reviewService.getApprovedReviews();

    expect(Array.isArray(reviews)).toBe(true);
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].status).toBe("approved");
    expect(reviews[0].rating).toBeGreaterThanOrEqual(1);
    expect(typeof reviews[0].body).toBe("string");
  });
});
