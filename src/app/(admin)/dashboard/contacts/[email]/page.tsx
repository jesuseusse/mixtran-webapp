import { notFound } from "next/navigation";
import * as contactService from "@/lib/services/contactService";
import * as bookingService from "@/lib/services/bookingService";
import { ContactNotesForm } from "@/components/admin/ContactNotesForm";

/** Route params for /dashboard/contacts/[email]. */
interface Params {
  params: Promise<{ email: string }>;
}

/**
 * Admin contact detail page — /dashboard/contacts/[email].
 *
 * Displays contact info, booking history, and lets the admin
 * edit notes, tags, and company. Server Component.
 */
export default async function ContactDetailPage({ params }: Params) {
  const { email } = await params;
  const decoded = decodeURIComponent(email);

  const contact = await contactService.getContact(decoded).catch(() => null);
  if (!contact) notFound();

  /* Load booking history for the last 90 days. */
  const dates = getDateRange(90);
  const slotArrays = await Promise.all(
    dates.map((d) =>
      bookingService.getAllSlots(d).catch(() => [] as import("@/lib/types/Slot").CalendarSlot[])
    )
  );
  const bookingHistory = slotArrays
    .flat()
    .filter((s) => s.contactEmail === decoded && !s.isAvailable)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-primary">{contact.name}</h1>
          <p className="mt-1 text-text-muted">{contact.email}</p>
        </div>
        <a
          href="/dashboard/contacts"
          className="text-sm text-primary hover:underline"
        >
          ← Volver a contactos
        </a>
      </div>

      {/* Contact info cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Teléfono" value={contact.phone} />
        <InfoCard label="Total reservas" value={String(contact.totalBookings)} />
        <InfoCard
          label="Última reserva"
          value={contact.lastBookingAt ? formatDate(contact.lastBookingAt) : "—"}
        />
      </div>

      {/* Notes / tags / company form */}
      <ContactNotesForm
        email={contact.email}
        initialNotes={contact.notes ?? ""}
        initialTags={contact.tags ?? []}
        initialCompany={contact.company ?? ""}
      />

      {/* Booking history */}
      <section>
        <h2 className="mb-4 font-heading text-xl font-semibold text-text-primary">
          Historial de reservas
        </h2>
        {bookingHistory.length === 0 ? (
          <p className="text-sm text-text-muted">Sin reservas registradas en los últimos 90 días.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background">
                <tr>
                  <Th>Fecha</Th>
                  <Th>Horario</Th>
                  <Th>Estado</Th>
                  <Th>Reservado el</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookingHistory.map((slot) => (
                  <tr key={slot.slotId}>
                    <Td>{slot.date}</Td>
                    <Td>{slot.startTime} – {slot.endTime}</Td>
                    <Td>
                      <StatusBadge status={slot.status} />
                    </Td>
                    <Td>{slot.bookedAt ? formatDate(slot.bookedAt) : "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/** Returns an array of YYYY-MM-DD strings for the last N days. */
function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }
  return dates;
}

/** Formats an ISO string to a short Spanish date/time. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: import("@/lib/types/Slot").SlotStatus }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:   { label: "Pendiente",  cls: "bg-warning/10 text-warning" },
    confirmed: { label: "Confirmada", cls: "bg-success/10 text-success" },
    cancelled: { label: "Cancelada",  cls: "bg-danger/10 text-danger" },
  };
  if (!status) return <span className="text-text-muted">—</span>;
  const { label, cls } = map[status] ?? { label: status, cls: "bg-border text-text-muted" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-text-secondary">{children}</td>;
}
