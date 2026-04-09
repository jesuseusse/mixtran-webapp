/**
 * Status values for a calendar slot.
 * null = free and available for booking.
 */
export type SlotStatus = "pending" | "confirmed" | "cancelled" | null;

/**
 * A time slot on the admin's calendar.
 * Stored in the `paint-slots` DynamoDB table.
 */
export interface CalendarSlot {
  /** UUID primary key. */
  slotId: string;
  /** Date in YYYY-MM-DD format. GSI partition key. */
  date: string;
  /** Start time in HH:MM 24-hour format. GSI sort key. */
  startTime: string;
  /** End time in HH:MM 24-hour format. */
  endTime: string;
  /** True when the slot has no booking and can be selected by a client. */
  isAvailable: boolean;
  /** Booking status. null means the slot is free. */
  status: SlotStatus;
  /** FK to contacts table. Set when booking is created. */
  contactEmail?: string;
  /** Client full name. Embedded on booking. */
  name?: string;
  /** Client phone number. Embedded on booking. */
  phone?: string;
  /** Optional message from the client. */
  message?: string;
  /** Advisory meeting URL (e.g. Google Meet). */
  meetLink?: string;
  /** ISO 8601 timestamp of when the booking was created. */
  bookedAt?: string;
}
