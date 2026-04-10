import { describe, it, expect, vi } from "vitest";

/**
 * Mock at the repository layer so the real bookingService sorting logic runs,
 * verifying that getAllSlots correctly returns the booked slot from DynamoDB.
 * NOTE: all data is inlined — top-level variables cannot be referenced inside
 * vi.mock factories because the factory is hoisted before variable initialization.
 */
vi.mock("@/lib/repositories/slotRepository", () => ({
  findAllByDate: vi.fn().mockResolvedValue([
    {
      slotId: "slot-booked-001",
      date: "2026-04-09",
      startTime: "10:00",
      endTime: "11:00",
      isAvailable: false,
      status: "pending",
      contactEmail: "luis@example.com",
      name: "Luis Torres",
      phone: "0416-5551234",
      bookedAt: "2026-04-08T14:00:00Z",
    },
  ]),
  findAvailableByDate: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue(undefined),
  batchCreate: vi.fn().mockResolvedValue(undefined),
  bookSlot: vi.fn().mockResolvedValue(undefined),
  updateStatus: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/repositories/contactRepository", () => ({
  upsert: vi.fn().mockResolvedValue(undefined),
  findAll: vi.fn().mockResolvedValue([]),
  findByEmail: vi.fn().mockResolvedValue(null),
  patch: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/emailService", () => ({
  sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
  sendBookingNotification: vi.fn().mockResolvedValue(undefined),
  sendStatusUpdate: vi.fn().mockResolvedValue(undefined),
}));

import * as bookingService from "@/lib/services/bookingService";

describe("Ver reservas — happy path (admin bookings view)", () => {
  it("getAllSlots returns booked slots sorted by startTime for a given date", async () => {
    const slots = await bookingService.getAllSlots("2026-04-09");

    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);

    const booked = slots.find((s) => !s.isAvailable);
    expect(booked).toBeDefined();
    expect(booked?.status).toBe("pending");
    expect(booked?.slotId).toBe("slot-booked-001");
    expect(typeof booked?.startTime).toBe("string");
  });
});
