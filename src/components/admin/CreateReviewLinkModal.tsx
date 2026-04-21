"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// ─── Types ───────────────────────────────────────────────────────────────────

/** Internal phase of the modal: composing vs. sharing the generated link. */
type Phase = "form" | "share";

/** Props accepted by CreateReviewLinkModal. */
export interface CreateReviewLinkModalProps {
  /** Whether the modal is currently open. */
  isOpen: boolean;
  /** Called when the user closes or dismisses the modal. */
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Admin modal for creating a one-time review invitation link.
 *
 * Phase 1 — "form": collect client name → POST /api/review-tokens
 * Phase 2 — "share": display generated URL with copy / WhatsApp / email options
 *
 * All state is reset when the modal closes (via useEffect on isOpen).
 */
export function CreateReviewLinkModal({ isOpen, onClose }: CreateReviewLinkModalProps) {
  const [phase, setPhase] = useState<Phase>("form");
  const [clientName, setClientName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [copied, setCopied] = useState(false);
  /* true when the browser supports the native share sheet (mobile). */
  const canNativeShare = useRef(typeof navigator !== "undefined" && !!navigator.share);

  /* Reset all state whenever the modal is closed. */
  useEffect(() => {
    if (!isOpen) {
      setPhase("form");
      setClientName("");
      setSubmitting(false);
      setError("");
      setGeneratedUrl("");
      setCopied(false);
    }
  }, [isOpen]);

  const handleCreate = useCallback(async () => {
    if (!clientName.trim()) {
      setError("El nombre del cliente es requerido");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/review-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: clientName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedUrl(json.data.url);
        setPhase("share");
      } else {
        setError(json.error ?? "Error al crear el enlace");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }, [clientName]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard API not available — silently ignore. */
    }
  }, [generatedUrl]);

  /* Pre-built share messages. */
  const shareMessage = `Hola ${clientName}, te invitamos a dejarnos tu reseña en el siguiente enlace: ${generatedUrl}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent("Tu opinión nos importa — MIXTRAN")}&body=${encodeURIComponent(shareMessage)}`;

  /** Invokes the native OS share sheet (mobile). */
  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({ title: "Enlace de reseña — MIXTRAN", text: shareMessage, url: generatedUrl });
    } catch {
      /* User cancelled or share failed — ignore. */
    }
  }, [shareMessage, generatedUrl]);

  const title = phase === "form" ? "Crear enlace para reseña" : "Enlace creado";

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      {/* ── Phase: form ──────────────────────────────────────────────── */}
      {phase === "form" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Ingresa el nombre del cliente para generar un enlace único de reseña válido por 30 días.
          </p>

          <Input
            label="Nombre del cliente"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            placeholder="Ej. María García"
            autoFocus
          />

          {error && (
            <p className="text-sm text-danger" role="alert">{error}</p>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              loading={submitting}
              onClick={handleCreate}
            >
              Crear enlace
            </Button>
          </div>
        </div>
      )}

      {/* ── Phase: share ─────────────────────────────────────────────── */}
      {phase === "share" && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Enlace creado para <strong className="text-text-primary">{clientName}</strong>.
            Cópialo o compártelo directamente.
          </p>

          {/* URL display */}
          <code className="block break-all rounded-md bg-background px-3 py-2.5 text-xs text-text-primary">
            {generatedUrl}
          </code>

          {/* Mobile: native share sheet — one button covers all apps */}
          {canNativeShare.current ? (
            <div className="flex flex-col gap-3">
              <Button onClick={handleNativeShare} className="w-full">
                Compartir
              </Button>
              <Button variant="secondary" onClick={handleCopy} className="w-full">
                {copied ? "¡Copiado!" : "Copiar enlace"}
              </Button>
            </div>
          ) : (
            /* Desktop: explicit Copy + WhatsApp + Email buttons */
            <>
              <Button variant="secondary" onClick={handleCopy} className="w-full">
                {copied ? "¡Copiado!" : "Copiar enlace"}
              </Button>

              <div className="flex gap-3">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-background"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-success" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>

                <a
                  href={mailHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-background"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  Email
                </a>
              </div>
            </>
          )}

          <Button variant="ghost" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      )}
    </Modal>
  );
}
