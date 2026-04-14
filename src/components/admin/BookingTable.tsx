"use client";

import { useState } from "react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { Snackbar } from "@/components/ui/Snackbar";
import { Spinner } from "@/components/ui/Spinner";
import { WhatsappContact } from "@/components/ui/WhatsappContact";
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
 * On small screens only date, client name and status are shown.
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

  async function handleStatusChange(slotId: string, status: "confirmed" | "cancelled") {
    setProcessing(slotId);
    try {
      const res = await fetch(`/api/calendar/bookings/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, meetLink: meetLinkInputs[slotId] ?? undefined }),
      });
      const json = await res.json();
      if (json.success) {
        setBookings((prev) =>
          prev.map((b) => (b.slotId === slotId ? { ...b, status } : b))
        );
        showSnackbar(status === "confirmed" ? "Cita confirmada" : "Cita cancelada");
      } else {
        showSnackbar(json.error ?? "Error al actualizar", "error");
      }
    } catch {
      showSnackbar("Error de conexión", "error");
    } finally {
      setProcessing(null);
    }
  }

  const columns: ColumnDef<CalendarSlot>[] = [
    {
      key: "date",
      header: "Fecha",
      render: (b) => b.date,
    },
    {
      key: "time",
      header: "Horario",
      hideBelow: "sm",
      render: (b) => `${b.startTime} – ${b.endTime}`,
    },
    {
      key: "name",
      header: "Cliente",
      render: (b) => b.name ?? "—",
    },
    {
      key: "email",
      header: "Email",
      hideBelow: "md",
      render: (b) =>
        b.contactEmail ? (
          <a href={`mailto:${b.contactEmail}`} className="text-primary hover:underline">
            {b.contactEmail}
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "phone",
      header: "Teléfono",
      hideBelow: "lg",
      render: (b) => b.phone ? <WhatsappContact phone={b.phone} /> : "—",
    },
    {
      key: "status",
      header: "Estado",
      render: (b) => <StatusBadge status={b.status} />,
    },
    {
      key: "meetLink",
      header: "Enlace reunión",
      hideBelow: "md",
      render: (b) =>
        b.status === "pending" ? (
          <input
            type="url"
            placeholder="https://meet.google.com/…"
            value={meetLinkInputs[b.slotId] ?? ""}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) =>
              setMeetLinkInputs((prev) => ({ ...prev, [b.slotId]: e.target.value }))
            }
            className="w-48 rounded-md border border-border bg-background px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        ) : b.meetLink ? (
          <a
            href={b.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Abrir enlace
          </a>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      header: "Acciones",
      render: (b) =>
        b.status === "pending" ? (
          <div className="flex gap-2">
            <ActionButton
              onClick={() => handleStatusChange(b.slotId, "confirmed")}
              disabled={processing === b.slotId}
              variant="confirm"
            >
              {processing === b.slotId ? <Spinner size="sm" /> : "Confirmar"}
            </ActionButton>
            <ActionButton
              onClick={() => handleStatusChange(b.slotId, "cancelled")}
              disabled={processing === b.slotId}
              variant="cancel"
            >
              Cancelar
            </ActionButton>
          </div>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={bookings}
        getRowKey={(b) => b.slotId}
        emptyMessage="No hay reservas registradas."
      />
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </>
  );
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
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-opacity disabled:opacity-60 ${cls}`}
    >
      {children}
    </button>
  );
}
