import { describe, it, expect, vi } from "vitest";

/** Authenticate the admin session. */
vi.mock("@/lib/auth/verifySession", () => ({
  verifySession: vi.fn().mockResolvedValue({ email: "admin@mixtran.com" }),
}));

/** Stub the contact service — no DynamoDB calls. */
vi.mock("@/lib/services/contactService", () => ({
  getAllContacts: vi.fn().mockResolvedValue([
    {
      email: "maria@example.com",
      name: "María García",
      phone: "0412-1234567",
      totalBookings: 2,
      createdAt: "2024-01-01T00:00:00Z",
      lastBookingAt: "2024-03-10T00:00:00Z",
    },
  ]),
  getContact: vi.fn().mockResolvedValue(null),
  upsertFromLanding: vi.fn().mockResolvedValue(undefined),
  patchContact: vi.fn().mockResolvedValue(undefined),
}));

import { GET } from "@/app/api/contacts/route";

describe("GET /api/contacts — happy path (admin contacts list)", () => {
  it("returns 200 with the contacts list for authenticated admin", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].email).toBe("maria@example.com");
    expect(body.data[0].name).toBe("María García");
  });
});
