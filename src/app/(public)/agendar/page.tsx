"use client";

import { useState, FormEvent, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Spinner } from "@/components/ui/Spinner";
import { Snackbar } from "@/components/ui/Snackbar";
import type { CalendarSlot } from "@/lib/types/Slot";

/** Formats YYYY-MM-DD to a locale Spanish date string. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Returns today's date as YYYY-MM-DD in local time (no UTC offset). */
function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Public booking page — /agendar.
 *
 * Clients pick a date, select an available slot, fill in their details,
 * and submit. The form POSTs to /api/calendar/bookings.
 */
export default function AgendarPage() {
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");

  /* Fetch slots whenever the selected date changes. */
  useEffect(() => {
    let cancelled = false;
    setSlots([]);
    setSelectedSlotId("");
    setLoadingSlots(true);

    fetch(`/api/calendar/slots?date=${date}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.success) {
          setSlots(json.data as CalendarSlot[]);
        }
      })
      .catch(() => {/* Network errors are silently ignored — UI shows empty list. */})
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedSlotId) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/calendar/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlotId, name, email, phone, message }),
      });
      const json = await res.json();

      if (json.success) {
        setSnackbarMessage("¡Cita solicitada! Recibirás un correo de confirmación.");
        setSnackbarType("success");
        /* Reset form on success. */
        setSelectedSlotId("");
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
        /* Refresh slots to remove the newly booked one. */
        setDate((d) => d);
      } else {
        setSnackbarMessage(json.error ?? "Ocurrió un error. Intenta de nuevo.");
        setSnackbarType("error");
      }
    } catch {
      setSnackbarMessage("Error de conexión. Intenta de nuevo.");
      setSnackbarType("error");
    } finally {
      setSubmitting(false);
      setSnackbarVisible(true);
    }
  }

  return (
    <main className="min-h-screen bg-background py-[var(--section-padding-y)] px-[var(--section-padding-x)]">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-heading text-4xl font-bold text-text-primary">
            Agenda tu Asesoría
          </h1>
          <p className="text-base leading-relaxed text-text-secondary">
            Selecciona una fecha y horario disponible para tu consulta de color personalizada.
          </p>
        </div>

        {/* Date picker */}
        <div className="mb-8 rounded-lg border border-border bg-surface p-6 shadow-card">
          <label
            htmlFor="date-picker"
            className="mb-2 block text-sm font-semibold text-text-primary"
          >
            Selecciona una fecha
          </label>
          <input
            id="date-picker"
            type="date"
            value={date}
            min={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {date && (
            <p className="mt-2 text-xs capitalize text-text-muted">{formatDate(date)}</p>
          )}
        </div>

        {/* Available slots */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Horarios disponibles
          </h2>

          {loadingSlots ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface py-8 text-center text-sm text-text-muted">
              No hay horarios disponibles para esta fecha.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {slots.map((slot) => (
                <button
                  key={slot.slotId}
                  type="button"
                  onClick={() => setSelectedSlotId(slot.slotId)}
                  className={[
                    "rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                    selectedSlotId === slot.slotId
                      ? "border-primary bg-primary text-on-primary"
                      : "border-border bg-surface text-text-primary hover:border-primary hover:text-primary",
                  ].join(" ")}
                >
                  {slot.startTime} – {slot.endTime}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Booking form — only shown when a slot is selected */}
        {selectedSlotId && (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-lg border border-border bg-surface p-6 shadow-card space-y-5"
          >
            <h2 className="font-heading text-xl font-bold text-text-primary">
              Tus datos de contacto
            </h2>

            <Input
              label="Nombre completo"
              type="text"
              required
              autoComplete="name"
              placeholder="Tu nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Correo electrónico"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Teléfono"
              type="tel"
              required
              autoComplete="tel"
              placeholder="0412-0000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Textarea
              label="Mensaje (opcional)"
              rows={3}
              placeholder="¿Hay algo específico que quieras consultar?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-button transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              {submitting && <Spinner size="sm" />}
              {submitting ? "Enviando…" : "Solicitar cita"}
            </button>
          </form>
        )}
      </div>

      <Snackbar
        visible={snackbarVisible}
        message={snackbarMessage}
        type={snackbarType}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </main>
  );
}
