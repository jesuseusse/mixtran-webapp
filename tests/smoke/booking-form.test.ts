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
  it("returns 201 for a valid Venezuelan number with +58 prefix", async () => {
    const req = new NextRequest("http://localhost/api/calendar/bookings", {
      method: "POST",
      body: JSON.stringify({
        slotId: "slot-abc-123",
        name: "Carlos Pérez",
        email: "carlos@example.com",
        phone: "+584149876543",
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

  it("returns 201 for a Mexican number with +52 prefix", async () => {
    const req = new NextRequest("http://localhost/api/calendar/bookings", {
      method: "POST",
      body: JSON.stringify({
        slotId: "slot-abc-456",
        name: "Ana López",
        email: "ana@example.com",
        phone: "+521234567890",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it("returns 400 when phone has no country code", async () => {
    const req = new NextRequest("http://localhost/api/calendar/bookings", {
      method: "POST",
      body: JSON.stringify({
        slotId: "slot-abc-123",
        name: "Carlos Pérez",
        email: "carlos@example.com",
        phone: "04149876543",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 400 when phone is only the dial code with no local digits", async () => {
    const req = new NextRequest("http://localhost/api/calendar/bookings", {
      method: "POST",
      body: JSON.stringify({
        slotId: "slot-abc-123",
        name: "Carlos Pérez",
        email: "carlos@example.com",
        phone: "+58",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
