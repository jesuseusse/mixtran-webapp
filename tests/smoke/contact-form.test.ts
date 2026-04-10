import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

/** verifySession is imported by the same route file (for the GET handler). */
vi.mock("@/lib/auth/verifySession", () => ({
  verifySession: vi.fn().mockResolvedValue({ email: "admin@mixtran.com" }),
}));

/** Stub the contact service — no DynamoDB calls. */
vi.mock("@/lib/services/contactService", () => ({
  upsertFromLanding: vi.fn().mockResolvedValue(undefined),
  getAllContacts: vi.fn().mockResolvedValue([]),
  getContact: vi.fn().mockResolvedValue(null),
  patchContact: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/contacts/route";

describe("POST /api/contacts — happy path (landing contact form)", () => {
  it("returns 201 and saves the contact for valid input", async () => {
    const req = new NextRequest("http://localhost/api/contacts", {
      method: "POST",
      body: JSON.stringify({
        name: "María García",
        email: "maria@example.com",
        phone: "0412-1234567",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.saved).toBe(true);
  });
});
