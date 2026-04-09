"use client";

import { useState } from "react";
import { Snackbar } from "@/components/ui/Snackbar";
import { Spinner } from "@/components/ui/Spinner";
import type { CalendarSlot } from "@/lib/types/Slot";

/** Props for BookingTable. */
export interface BookingTableProps {
  /** Initial list of booked slots passed from the server component. */
  bookings: CalendarSlot[];
}

/**
 * Admin booking table component.
 *
 * Renders all booked slots and lets the admin confirm or cancel each one.
 * Calls PATCH /api/calendar/bookings/[id] on status change.
 * Accepts initial data from a Server Component and manages updates locally.
 */
export function BookingTable({ bookings: initialBookings }: BookingTableProps) {
  const [bookings, setBookings] = useState<CalendarSlot[]>(initialBookings);
  const [processing, setProcessing] = useState<string | null>(null);
  const [meetLinkInputs, setMeetLinkInputs] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error",
  });

  function showSnackbar(message: string, type: "success" | "error" = "success") {
    setSnackbar({ visible: true, message, type });
  }

  async function handleStatusChange(
    slotId: string,
    status: "confirmed" | "cancelled"
  ) {
    setProcessing(slotId);
    try {
      const res = await fetch(`/api/calendar/bookings/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          meetLink: meetLinkInputs[slotId] ?? undefined,
        }),
      });
      const json = await res.json();

      if (json.success) {
        setBookings((prev) =>
          prev.map((b) => (b.slotId === slotId ? { ...b, status } : b))
        );
        showSnackbar(
          status === "confirmed" ? "Cita confirmada" : "Cita cancelada"
        );
      } else {
        showSnackbar(json.error ?? "Error al actualizar", "error");
      }
    } catch {
      showSnackbar("Error de conexión", "error");
    } finally {
      setProcessing(null);
    }
  }

  if (bookings.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface py-10 text-center text-sm text-text-muted">
        No hay reservas registradas.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-card">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-background">
            <tr>
              <Th>Fecha</Th>
              <Th>Horario</Th>
              <Th>Cliente</Th>
              <Th>Email</Th>
              <Th>Teléfono</Th>
              <Th>Estado</Th>
              <Th>Enlace reunión</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.map((booking) => (
              <tr key={booking.slotId} className="hover:bg-background/50">
                <Td>{booking.date}</Td>
                <Td>
                  {booking.startTime} – {booking.endTime}
                </Td>
                <Td>{booking.name ?? "—"}</Td>
                <Td>
                  {booking.contactEmail ? (
                    <a
                      href={`mailto:${booking.contactEmail}`}
                      className="text-primary hover:underline"
                    >
                      {booking.contactEmail}
                    </a>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>{booking.phone ?? "—"}</Td>
                <Td>
                  <StatusBadge status={booking.status} />
                </Td>
                <Td>
                  {booking.status === "pending" ? (
                    <input
                      type="url"
                      placeholder="https://meet.google.com/…"
                      value={meetLinkInputs[booking.slotId] ?? ""}
                      onChange={(e) =>
                        setMeetLinkInputs((prev) => ({
                          ...prev,
                          [booking.slotId]: e.target.value,
                        }))
                      }
                      className="w-48 rounded-md border border-border bg-background px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : booking.meetLink ? (
                    <a
                      href={booking.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Abrir enlace
                    </a>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td>
                  {booking.status === "pending" && (
                    <div className="flex gap-2">
                      <ActionButton
                        onClick={() =>
                          handleStatusChange(booking.slotId, "confirmed")
                        }
                        disabled={processing === booking.slotId}
                        variant="confirm"
                      >
                        {processing === booking.slotId ? <Spinner size="sm" /> : "Confirmar"}
                      </ActionButton>
                      <ActionButton
                        onClick={() =>
                          handleStatusChange(booking.slotId, "cancelled")
                        }
                        disabled={processing === booking.slotId}
                        variant="cancel"
                      >
                        Cancelar
                      </ActionButton>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </>
  );
}

/** Table header cell. */
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </th>
  );
}

/** Table data cell. */
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-text-secondary">{children}</td>;
}

/** Status badge with semantic colors. */
function StatusBadge({ status }: { status: CalendarSlot["status"] }) {
  const map: Record<NonNullable<CalendarSlot["status"]>, { label: string; cls: string }> = {
    pending:   { label: "Pendiente",  cls: "bg-warning/10 text-warning" },
    confirmed: { label: "Confirmada", cls: "bg-success/10 text-success" },
    cancelled: { label: "Cancelada",  cls: "bg-danger/10 text-danger" },
  };
  if (!status) return <span className="text-text-muted">—</span>;
  const { label, cls } = map[status];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

/** Small action button with two visual variants. */
function ActionButton({
  children,
  onClick,
  disabled,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  variant: "confirm" | "cancel";
}) {
  const cls =
    variant === "confirm"
      ? "bg-success text-on-success hover:opacity-90"
      : "bg-danger text-on-danger hover:opacity-90";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-opacity disabled:opacity-60 ${cls}`}
    >
      {children}
    </button>
  );
}
