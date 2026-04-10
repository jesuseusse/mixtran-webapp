import * as contactRepository from "@/lib/repositories/contactRepository";
import type { Contact, UpsertContactInput } from "@/lib/types/Contact";

/**
 * Returns all contacts sorted by name ascending.
 */
export async function getAllContacts(): Promise<Contact[]> {
  const contacts = await contactRepository.findAll();
  return contacts.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns a single contact by email.
 * Throws if not found.
 */
export async function getContact(email: string): Promise<Contact> {
  const contact = await contactRepository.findByEmail(email);
  if (!contact) throw new Error(`contactService.getContact: not found — ${email}`);
  return contact;
}

/**
 * Upserts a contact from the public landing page contact form.
 * Creates the record if it doesn't exist; updates name and phone on subsequent submissions.
 * Does not increment totalBookings — that is reserved for booking-originated upserts.
 */
export async function upsertFromLanding(input: UpsertContactInput): Promise<void> {
  await contactRepository.upsert(input);
}

/**
 * Applies admin-only patch fields (tags, notes, company) to a contact.
 */
export async function patchContact(
  email: string,
  fields: Partial<Pick<Contact, "tags" | "notes" | "company">>
): Promise<void> {
  await contactRepository.patch(email, fields);
}
