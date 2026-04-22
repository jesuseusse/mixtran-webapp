/**
 * A client record in the CRM.
 * Created or updated automatically on first booking via contactRepository.upsert().
 * Stored in the `paint-contacts` DynamoDB table.
 */
export interface Contact {
  /** Email address — primary key, unique identifier. */
  email: string;
  /** Full name. */
  name: string;
  /** Phone number. */
  phone: string;
  /** Optional company name. */
  company?: string;
  /** Admin-defined labels for segmentation. */
  tags?: string[];
  /** Free-form admin notes. */
  notes?: string;
  /** Auto-incremented count of all bookings made by this contact. */
  totalBookings: number;
  /** ISO 8601 timestamp of the most recent booking. */
  lastBookingAt?: string;
  /** ISO 8601 timestamp of record creation. */
  createdAt: string;
  /** ISO 8601 timestamp of last modification. */
  updatedAt: string;
}

/**
 * Minimal contact data upserted from a booking form submission.
 */
export interface UpsertContactInput {
  email: string;
  name: string;
  phone: string;
  /** Optional message from the landing page contact form. */
  message?: string;
}
