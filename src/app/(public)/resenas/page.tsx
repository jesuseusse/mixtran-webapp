"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Spinner } from "@/components/ui/Spinner";
import { Snackbar } from "@/components/ui/Snackbar";

/** Star rating selector — renders 5 clickable stars. */
function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label="Calificación">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={[
            "text-2xl leading-none transition-colors",
            star <= value ? "text-accent" : "text-border hover:text-accent/60",
          ].join(" ")}
          aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/**
 * Public review submission page — /resenas.
 *
 * Clients submit a name, optional email, star rating, and review body.
 * POSTs to /api/reviews — the review is created with status="pending"
 * and requires admin approval before appearing on the landing page.
 */
export default function ResenasPage() {
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: "", type: "success" as "success" | "error" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      setSnackbar({ visible: true, message: "Por favor selecciona una calificación.", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, email: email || undefined, phone: phone || undefined, rating, body }),
      });
      const json = await res.json();

      if (json.success) {
        setSubmitted(true);
      } else {
        setSnackbar({ visible: true, message: json.error ?? "Ocurrió un error. Intenta de nuevo.", type: "error" });
      }
    } catch {
      setSnackbar({ visible: true, message: "Error de conexión. Intenta de nuevo.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-background py-[var(--section-padding-y)] px-[var(--section-padding-x)]">
      <div className="mx-auto max-w-lg">
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-heading text-4xl font-bold text-text-primary">
            Deja tu Reseña
          </h1>
          <p className="text-base leading-relaxed text-text-secondary">
            Tu opinión nos ayuda a mejorar y a que otros clientes conozcan nuestra calidad.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-lg border border-success/30 bg-success/5 p-8 text-center shadow-card">
            <p className="mb-2 text-4xl">🎉</p>
            <h2 className="mb-2 font-heading text-xl font-bold text-text-primary">
              ¡Gracias por tu reseña!
            </h2>
            <p className="text-sm text-text-secondary">
              Tu reseña fue recibida y aparecerá en el sitio una vez que sea revisada por nuestro equipo.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-lg border border-border bg-surface p-8 shadow-card space-y-6"
          >
            <Input
              label="Tu nombre"
              type="text"
              required
              autoComplete="name"
              placeholder="¿Cómo te llamas?"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />

            <Input
              label="Correo electrónico (opcional)"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Teléfono (opcional)"
              type="tel"
              autoComplete="tel"
              placeholder="0412-0000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div>
              <p className="mb-2 block text-sm font-semibold text-text-primary">
                Calificación <span className="text-danger">*</span>
              </p>
              <StarPicker value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="mt-1 text-xs text-text-muted">
                  {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][rating]}
                </p>
              )}
            </div>

            <Textarea
              label="Tu reseña"
              required
              rows={5}
              placeholder="Cuéntanos tu experiencia con nuestros productos o servicio…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-button transition-colors hover:bg-primary-dark disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {submitting && <Spinner size="sm" />}
              {submitting ? "Enviando…" : "Enviar reseña"}
            </button>
          </form>
        )}
      </div>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </main>
  );
}
