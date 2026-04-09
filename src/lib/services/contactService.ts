import * as contactRepository from "@/lib/repositories/contactRepository";
import type { Contact } from "@/lib/types/Contact";

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
 * Applies admin-only patch fields (tags, notes, company) to a contact.
 */
export async function patchContact(
  email: string,
  fields: Partial<Pick<Contact, "tags" | "notes" | "company">>
): Promise<void> {
  await contactRepository.patch(email, fields);
}
