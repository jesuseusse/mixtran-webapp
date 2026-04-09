import * as contactService from "@/lib/services/contactService";

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

      {contacts.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface py-10 text-center text-sm text-text-muted">
          No hay contactos registrados. Se crean automáticamente al recibir una reserva.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-background">
              <tr>
                <Th>Nombre</Th>
                <Th>Email</Th>
                <Th>Teléfono</Th>
                <Th>Reservas</Th>
                <Th>Última reserva</Th>
                <Th>Registrado</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contacts.map((contact) => (
                <tr key={contact.email} className="hover:bg-background/50">
                  <Td>
                    <span className="font-medium text-text-primary">{contact.name}</span>
                    {contact.company && (
                      <span className="ml-2 text-xs text-text-muted">{contact.company}</span>
                    )}
                  </Td>
                  <Td>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-primary hover:underline"
                    >
                      {contact.email}
                    </a>
                  </Td>
                  <Td>{contact.phone}</Td>
                  <Td>
                    <span className="font-semibold text-text-primary">
                      {contact.totalBookings}
                    </span>
                  </Td>
                  <Td>
                    {contact.lastBookingAt
                      ? formatDate(contact.lastBookingAt)
                      : "—"}
                  </Td>
                  <Td>{formatDate(contact.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Formats an ISO 8601 string to a short Spanish date. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-text-secondary">{children}</td>;
}
