"use client";

import { useState } from "react";
import { Rating } from "@/components/ui/Rating";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/ui/ImageUploader";


// ─── Types ───────────────────────────────────────────────────────────────────

/** All possible steps in the review flow. */
type Step = "welcome" | "rating" | "message" | "photo" | "confirm" | "success";

/** Props accepted by ReviewStepper. */
export interface ReviewStepperProps {
  /** The review invitation token — used to mark as used on submit. */
  token: string;
  /** Client's name, pre-filled from the token record. */
  clientName: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Quick-insert chips for the message step. */
const QUICK_CHIPS = [
  "Excelente servicio",
  "Calidad superior a la esperada",
  "Lo recomiendo",
  "Resultados increíbles",
];

/** Steps that show the progress dots indicator. */
const PROGRESS_STEPS: Step[] = ["rating", "message", "photo", "confirm"];

// ─── Progress indicator ───────────────────────────────────────────────────────

function ProgressDots({ current }: { current: Step }) {
  const idx = PROGRESS_STEPS.indexOf(current);
  if (idx === -1) return null;

  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {PROGRESS_STEPS.map((_, i) => (
        <span
          key={i}
          className={[
            "h-2 w-2 rounded-full transition-colors",
            i <= idx ? "bg-primary" : "bg-border",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Multi-step review submission form for the public /resena/[token] page.
 *
 * Steps: welcome → rating → message → photo → confirm → success
 *
 * On submit:
 *  1. POST /api/reviews with rating, body, photoUrl, authorName
 *  2. PATCH /api/review-tokens/[token] to mark the token as used
 */
export function ReviewStepper({ token, clientName }: ReviewStepperProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Appends a chip text to the body (with separator if body is non-empty). */
  function appendChip(chip: string) {
    setBody((prev) => (prev.trim() ? `${prev.trim()}. ${chip}` : chip));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");

    try {
      const reviewRes = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: clientName, rating, body, photoUrl }),
      });
      const reviewJson = await reviewRes.json();
      if (!reviewJson.success) throw new Error(reviewJson.error ?? "Error al enviar");

      /* Fire-and-forget: mark the token used — don't block the success screen. */
      fetch(`/api/review-tokens/${token}`, { method: "PATCH" }).catch(() => {});

      setStep("success");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Ocurrió un error. Intenta de nuevo."
      );
      setSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      <ProgressDots current={step} />

      {/* ── WELCOME ──────────────────────────────────────────────────── */}
      {step === "welcome" && (
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          {/* Brand mark */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-primary"
              aria-hidden="true"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>

          <div>
            <h1 className="font-heading text-2xl font-bold text-text-primary">
              Hola, {clientName}
            </h1>
            <p className="mt-2 text-text-secondary">
              Nos gustaría conocer tu experiencia con MIXTRAN. Solo toma un momento.
            </p>
          </div>

          <Button size="lg" onClick={() => setStep("rating")}>
            Comenzar
          </Button>
        </div>
      )}

      {/* ── RATING ───────────────────────────────────────────────────── */}
      {step === "rating" && (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h2 className="font-heading text-xl font-bold text-text-primary">
              ¿Cómo calificarías nuestro servicio?
            </h2>
            <p className="mt-1 text-sm text-text-muted">Selecciona de 1 a 5 estrellas</p>
          </div>

          <div className="flex justify-center py-2">
            <Rating value={rating} onChange={setRating} size="md" />
          </div>

          <Button
            disabled={rating === 0}
            onClick={() => setStep("message")}
          >
            Continuar
          </Button>
        </div>
      )}

      {/* ── MESSAGE ──────────────────────────────────────────────────── */}
      {step === "message" && (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h2 className="font-heading text-xl font-bold text-text-primary">
              Cuéntanos más
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              ¿Qué fue lo que más te gustó?
            </p>
          </div>

          {/* Quick-insert chips */}
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => appendChip(chip)}
                className="rounded-full border border-border px-3 py-1 text-sm text-text-secondary transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                {chip}
              </button>
            ))}
          </div>

          <Textarea
            label="Tu mensaje"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Escribe tu experiencia aquí…"
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("rating")}>
              Atrás
            </Button>
            <Button
              className="flex-1"
              disabled={!body.trim()}
              onClick={() => setStep("photo")}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* ── PHOTO ────────────────────────────────────────────────────── */}
      {step === "photo" && (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h2 className="font-heading text-xl font-bold text-text-primary">
              Agrega una foto
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Opcional — muestra el resultado en tu espacio
            </p>
          </div>

          <ImageUploader
            onUploadComplete={(url) => setPhotoUrl(url)}
            onDelete={() => setPhotoUrl(undefined)}
            initialUrl={photoUrl}
            aspectRatio={1}
            label="Subir foto del resultado"
            compress={{ maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true }}
            uploadEndpoint="/api/reviews/upload"
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("message")}>
              Atrás
            </Button>
            <Button className="flex-1" onClick={() => setStep("confirm")}>
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* ── CONFIRM ──────────────────────────────────────────────────── */}
      {step === "confirm" && (
        <div className="flex flex-col gap-5">
          <div className="text-center">
            <h2 className="font-heading text-xl font-bold text-text-primary">
              Confirma tu reseña
            </h2>
          </div>

          {/* Summary card */}
          <div className="rounded-lg border border-border bg-surface p-4 shadow-card space-y-3">
            <Rating value={rating} size="md" />

            <p className="text-sm text-text-secondary">
              {body.length > 200 ? `${body.slice(0, 200)}…` : body}
            </p>

            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt="Foto adjunta"
                className="h-20 w-20 rounded-md object-cover"
              />
            )}
          </div>

          {submitError && (
            <p className="text-sm text-danger" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep("photo")}>
              Atrás
            </Button>
            <Button
              className="flex-1"
              loading={submitting}
              onClick={handleSubmit}
            >
              {submitting ? "Enviando…" : "Enviar reseña"}
            </Button>
          </div>
        </div>
      )}

      {/* ── SUCCESS ──────────────────────────────────────────────────── */}
      {step === "success" && (
        <div className="flex flex-col items-center gap-6 py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-success"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <div>
            <h2 className="font-heading text-2xl font-bold text-text-primary">
              ¡Gracias, {clientName}!
            </h2>
            <p className="mt-2 text-text-secondary">
              Tu reseña fue enviada y será publicada una vez aprobada.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
