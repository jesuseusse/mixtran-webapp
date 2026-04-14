import * as contactService from "@/lib/services/contactService";
import { ContactsTable } from "@/components/admin/ContactsTable";

/**
 * Admin contacts (CRM) page — /dashboard/contacts.
 *
 * Displays all contacts sorted by name with booking stats.
 * Server Component — data fetched at request time.
 */
export default async function ContactsPage() {
  const contacts = await contactService.getAllContacts().catch((err) => {
    console.error("ContactsPage: failed to load contacts —", err?.message);
    return [] as import("@/lib/types/Contact").Contact[];
  });

  return (
    <div>
      <h1 className="mb-8 font-heading text-3xl font-bold text-text-primary">
        Contactos{" "}
        <span className="text-xl font-normal text-text-muted">({contacts.length})</span>
      </h1>
      <ContactsTable contacts={contacts} />
    </div>
  );
}
