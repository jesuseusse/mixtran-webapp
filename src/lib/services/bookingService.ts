import { randomUUID } from "crypto";
import * as slotRepository from "@/lib/repositories/slotRepository";
import * as contactRepository from "@/lib/repositories/contactRepository";
import * as emailService from "@/lib/services/emailService";
import type { CalendarSlot } from "@/lib/types/Slot";
import type { CreateBookingInput, UpdateBookingStatusInput } from "@/lib/types/Booking";

/**
 * Input for creating a new available slot (admin only).
 */
export interface CreateSlotInput {
  date: string;
  startTime: string;
  endTime: string;
}

/**
 * Returns all available slots for the given date, sorted by startTime.
 */
export async function getAvailableSlots(date: string): Promise<CalendarSlot[]> {
  const slots = await slotRepository.findAvailableByDate(date);
  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Returns all slots for the given date (admin view), sorted by startTime.
 */
export async function getAllSlots(date: string): Promise<CalendarSlot[]> {
  const slots = await slotRepository.findAllByDate(date);
  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Creates a single available slot. Admin only.
 */
export async function createSlot(input: CreateSlotInput): Promise<CalendarSlot> {
  const slot: CalendarSlot = {
    slotId: randomUUID(),
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    isAvailable: true,
    status: null,
  };
  await slotRepository.create(slot);
  return slot;
}

/**
 * Creates multiple slots in a single batch operation. Admin only.
 * Splits into chunks of 25 to respect DynamoDB batch write limits.
 */
export async function createSlotsBulk(inputs: CreateSlotInput[]): Promise<CalendarSlot[]> {
  const slots: CalendarSlot[] = inputs.map((input) => ({
    slotId: randomUUID(),
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    isAvailable: true,
    status: null,
  }));

  /* DynamoDB BatchWrite limit is 25 items per call. */
  const CHUNK_SIZE = 25;
  for (let i = 0; i < slots.length; i += CHUNK_SIZE) {
    await slotRepository.batchCreate(slots.slice(i, i + CHUNK_SIZE));
  }

  return slots;
}

/**
 * Deletes an unbooked slot. Throws if the slot is already booked.
 */
export async function deleteSlot(slotId: string): Promise<void> {
  const slot = await slotRepository.findById(slotId);
  if (!slot) throw new Error("bookingService.deleteSlot: slot not found");
  if (!slot.isAvailable) {
    throw new Error("bookingService.deleteSlot: cannot delete a booked slot");
  }
  await slotRepository.remove(slotId);
}

/**
 * Books a slot on behalf of a client.
 * Validates availability, writes the booking, upserts the contact record,
 * and sends confirmation emails to both parties.
 *
 * Throws if the slot does not exist or is no longer available.
 */
export async function createBooking(input: CreateBookingInput): Promise<void> {
  const slot = await slotRepository.findById(input.slotId);
  if (!slot) throw new Error("bookingService.createBooking: slot not found");
  if (!slot.isAvailable) {
    throw new Error("bookingService.createBooking: slot is no longer available");
  }

  /* Write booking and upsert contact in parallel — both are independent writes. */
  await Promise.all([
    slotRepository.bookSlot(input),
    contactRepository.upsert({
      email: input.email,
      name: input.name,
      phone: input.phone,
    }),
  ]);

  /* Fire-and-forget emails — do not let email failures block the booking. */
  void Promise.all([
    emailService.sendBookingConfirmation(input, slot),
    emailService.sendBookingNotification(input, slot),
  ]).catch((err) =>
    console.error("bookingService.createBooking: email send failed", err)
  );
}

/**
 * Updates the booking status (confirmed | cancelled) and sends a notification to the client.
 * Admin only.
 */
export async function updateBookingStatus(input: UpdateBookingStatusInput): Promise<void> {
  const slot = await slotRepository.findById(input.slotId);
  if (!slot) throw new Error("bookingService.updateBookingStatus: slot not found");

  await slotRepository.updateStatus(input);

  /* Send client notification fire-and-forget. */
  void emailService
    .sendStatusUpdate({ ...slot, status: input.status, meetLink: input.meetLink }, input.status)
    .catch((err) =>
      console.error("bookingService.updateBookingStatus: email send failed", err)
    );
}
