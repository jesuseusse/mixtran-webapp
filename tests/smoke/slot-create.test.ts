import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

/** Authenticate the admin session for protected routes. */
vi.mock("@/lib/auth/verifySession", () => ({
  verifySession: vi.fn().mockResolvedValue({ email: "admin@mixtran.com" }),
}));

/** Stub the booking service — no DynamoDB calls. */
vi.mock("@/lib/services/bookingService", () => ({
  createSlot: vi.fn().mockResolvedValue({
    slotId: "new-slot-uuid",
    date: "2026-05-10",
    startTime: "09:00",
    endTime: "10:00",
    isAvailable: true,
    status: null,
  }),
  getAvailableSlots: vi.fn().mockResolvedValue([]),
  getAllSlots: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn(),
  createSlotsBulk: vi.fn(),
  deleteSlot: vi.fn(),
  updateBookingStatus: vi.fn(),
}));

import { POST } from "@/app/api/calendar/slots/route";

describe("POST /api/calendar/slots — happy path (admin create slot)", () => {
  it("returns 201 with the created slot for authenticated admin", async () => {
    const req = new NextRequest("http://localhost/api/calendar/slots", {
      method: "POST",
      body: JSON.stringify({ date: "2026-05-10", startTime: "09:00", endTime: "10:00" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.slotId).toBe("new-slot-uuid");
    expect(body.data.date).toBe("2026-05-10");
    expect(body.data.isAvailable).toBe(true);
  });
});
