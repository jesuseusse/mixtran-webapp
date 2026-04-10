import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

/** Stub the booking service — no DynamoDB or SES calls. */
vi.mock("@/lib/services/bookingService", () => ({
  createBooking: vi.fn().mockResolvedValue(undefined),
  getAvailableSlots: vi.fn().mockResolvedValue([]),
  getAllSlots: vi.fn().mockResolvedValue([]),
  createSlot: vi.fn(),
  createSlotsBulk: vi.fn(),
  deleteSlot: vi.fn(),
  updateBookingStatus: vi.fn(),
}));

import { POST } from "@/app/api/calendar/bookings/route";

describe("POST /api/calendar/bookings — happy path (public booking form)", () => {
  it("returns 201 and confirms the booking for valid input", async () => {
    const req = new NextRequest("http://localhost/api/calendar/bookings", {
      method: "POST",
      body: JSON.stringify({
        slotId: "slot-abc-123",
        name: "Carlos Pérez",
        email: "carlos@example.com",
        phone: "0414-9876543",
        message: "Quiero pintar la fachada del local.",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.booked).toBe(true);
  });
});
