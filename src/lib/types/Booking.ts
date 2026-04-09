/**
 * Input payload for creating a new booking from the public booking page.
 */
export interface CreateBookingInput {
  /** UUID of the slot being booked. */
  slotId: string;
  /** Client full name. */
  name: string;
  /** Client email address. Used as PK in contacts table. */
  email: string;
  /** Client phone number. */
  phone: string;
  /** Optional message from the client. */
  message?: string;
}

/**
 * Input payload for updating a booking's status from the admin dashboard.
 */
export interface UpdateBookingStatusInput {
  /** UUID of the slot to update. */
  slotId: string;
  /** New status value. */
  status: "confirmed" | "cancelled";
  /** Optional advisory meeting URL to attach when confirming. */
  meetLink?: string;
}
