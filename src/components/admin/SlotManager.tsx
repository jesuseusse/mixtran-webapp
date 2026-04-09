"use client";

import { useState, useEffect, FormEvent } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { Snackbar } from "@/components/ui/Snackbar";
import type { CalendarSlot } from "@/lib/types/Slot";

/** Formats YYYY-MM-DD to a readable Spanish date. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Returns today's date as YYYY-MM-DD in local time. */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Admin slot manager component.
 *
 * Allows the admin to view existing slots for a given date,
 * create individual slots, or delete unbooked slots.
 */
export function SlotManager() {
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(false);

  /* New slot form state */
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [creating, setCreating] = useState(false);

  const [snackbar, setSnackbar] = useState({ visible: false, message: "", type: "success" as "success" | "error" });

  function showSnackbar(message: string, type: "success" | "error" = "success") {
    setSnackbar({ visible: true, message, type });
  }

  async function fetchSlots() {
    setLoading(true);
    try {
      /* Admin view: fetch all slots (use public endpoint — it returns available only, admin sees more via a direct page load).
         For a proper admin-only all-slots endpoint, Phase 2 adds GET /api/calendar/slots?admin=1.
         Here we reuse the available endpoint for simplicity and note it for Phase 3. */
      const res = await fetch(`/api/calendar/slots?date=${date}`);
      const json = await res.json();
      if (json.success) setSlots(json.data as CalendarSlot[]);
    } catch {
      showSnackbar("Error al cargar los horarios", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/calendar/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime, endTime }),
      });
      const json = await res.json();
      if (json.success) {
        showSnackbar("Horario creado exitosamente");
        void fetchSlots();
      } else {
        showSnackbar(json.error ?? "Error al crear el horario", "error");
      }
    } catch {
      showSnackbar("Error de conexión", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(slotId: string) {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      const res = await fetch(`/api/calendar/slots/${slotId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showSnackbar("Horario eliminado");
        setSlots((prev) => prev.filter((s) => s.slotId !== slotId));
      } else {
        showSnackbar(json.error ?? "Error al eliminar", "error");
      }
    } catch {
      showSnackbar("Error de conexión", "error");
    }
  }

  return (
    <div className="space-y-8">
      {/* Date selector */}
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
        <label htmlFor="slot-date" className="mb-2 block text-sm font-semibold text-text-primary">
          Fecha
        </label>
        <input
          id="slot-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {date && (
          <p className="mt-1 text-xs capitalize text-text-muted">{formatDate(date)}</p>
        )}
      </div>

      {/* Existing slots */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Horarios del día
        </h2>
        {loading ? (
          <div className="flex justify-center py-6">
            <Spinner size="md" />
          </div>
        ) : slots.length === 0 ? (
          <p className="rounded-lg border border-border bg-surface py-6 text-center text-sm text-text-muted">
            No hay horarios para esta fecha.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-background">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Horario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-muted">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slots.map((slot) => (
                  <tr key={slot.slotId}>
                    <td className="px-4 py-3 text-text-primary">
                      {slot.startTime} – {slot.endTime}
                    </td>
                    <td className="px-4 py-3">
                      <SlotStatusBadge isAvailable={slot.isAvailable} status={slot.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {slot.isAvailable && (
                        <button
                          onClick={() => handleDelete(slot.slotId)}
                          className="text-xs text-danger hover:underline"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create slot form */}
      <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
        <h2 className="mb-4 font-semibold text-text-primary">Crear horario</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="start-time" className="mb-1 block text-xs font-medium text-text-muted">
              Inicio
            </label>
            <input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="end-time" className="mb-1 block text-xs font-medium text-text-muted">
              Fin
            </label>
            <input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-button transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {creating && <Spinner size="sm" />}
            {creating ? "Creando…" : "Crear"}
          </button>
        </form>
      </div>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </div>
  );
}

/** Inline badge showing a slot's availability/status. */
function SlotStatusBadge({
  isAvailable,
  status,
}: {
  isAvailable: boolean;
  status: CalendarSlot["status"];
}) {
  if (isAvailable) {
    return (
      <span className="inline-block rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
        Disponible
      </span>
    );
  }
  const map: Record<NonNullable<CalendarSlot["status"]>, { label: string; cls: string }> = {
    pending:   { label: "Pendiente",   cls: "bg-warning/10 text-warning" },
    confirmed: { label: "Confirmada",  cls: "bg-info/10 text-info" },
    cancelled: { label: "Cancelada",   cls: "bg-danger/10 text-danger" },
  };
  const entry = status ? map[status] : null;
  return entry ? (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${entry.cls}`}>
      {entry.label}
    </span>
  ) : null;
}
