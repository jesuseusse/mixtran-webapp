import * as contactService from "@/lib/services/contactService";
import * as bookingService from "@/lib/services/bookingService";
import type { CalendarSlot } from "@/lib/types/Slot";
import type { Contact } from "@/lib/types/Contact";

/**
 * Admin dashboard overview — /dashboard.
 *
 * Displays KPI cards: total contacts, pending bookings for today.
 * Server Component — data is fetched at request time.
 * Handles ResourceNotFoundException gracefully when DynamoDB tables are not yet created.
 */
export default async function DashboardPage() {
  const today = todayIso();

  /* Fetch both independently so one failure does not block the other. */
  const [contacts, todaySlots] = await Promise.all([
    contactService.getAllContacts().catch((err) => {
      console.error("DashboardPage: failed to load contacts —", err?.message);
      return [] as Contact[];
    }),
    bookingService.getAllSlots(today).catch((err) => {
      console.error("DashboardPage: failed to load slots —", err?.message);
      return [] as CalendarSlot[];
    }),
  ]);

  const pendingBookings = todaySlots.filter((s) => s.status === "pending");
  const confirmedBookings = todaySlots.filter((s) => s.status === "confirmed");

  return (
    <div>
      <h1 className="mb-8 font-heading text-3xl font-bold text-text-primary">Resumen</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Contactos totales" value={contacts.length} />
        <KpiCard
          label="Citas pendientes hoy"
          value={pendingBookings.length}
          accent={pendingBookings.length > 0}
        />
        <KpiCard label="Citas confirmadas hoy" value={confirmedBookings.length} />
      </div>

      {/* Recent pending bookings */}
      {pendingBookings.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-heading text-xl font-semibold text-text-primary">
            Citas pendientes — {formatDate(today)}
          </h2>
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background">
                <tr>
                  <Th>Horario</Th>
                  <Th>Cliente</Th>
                  <Th>Email</Th>
                  <Th>Teléfono</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingBookings.map((slot) => (
                  <tr key={slot.slotId}>
                    <Td>
                      {slot.startTime} – {slot.endTime}
                    </Td>
                    <Td>{slot.name ?? "—"}</Td>
                    <Td>{slot.contactEmail ?? "—"}</Td>
                    <Td>{slot.phone ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-right text-xs text-text-muted">
            <a href="/dashboard/calendar/bookings" className="text-primary hover:underline">
              Ver todas las reservas →
            </a>
          </p>
        </section>
      )}
    </div>
  );
}

/** Returns today's date as YYYY-MM-DD in local time. */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Formats YYYY-MM-DD to a readable Spanish date. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

/** KPI card component. */
function KpiCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-lg border p-6 shadow-card",
        accent
          ? "border-accent/30 bg-accent/5"
          : "border-border bg-surface",
      ].join(" ")}
    >
      <p className="text-sm text-text-muted">{label}</p>
      <p
        className={[
          "mt-2 font-heading text-4xl font-bold",
          accent ? "text-accent" : "text-text-primary",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
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
