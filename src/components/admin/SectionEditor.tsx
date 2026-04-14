"use client";

import { useState } from "react";
import { Input, Textarea, Button } from "@/components/ui";
import type { SectionId } from "@/lib/types/LandingSection";

/** Human-readable label for each section. */
const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Hero",
  about: "Nosotros",
  products: "Productos",
  gallery: "Galería",
  reviews: "Reseñas (encabezado)",
  booking_cta: "CTA de reservas",
  contact: "Contacto",
};

/** Fields to render for each section, in display order. */
const SECTION_FIELDS: Record<SectionId, Array<{ key: string; label: string; type: "input" | "textarea" | "url" }>> = {
  hero: [
    { key: "headline",          label: "Título principal",   type: "input"    },
    { key: "subtitle",          label: "Subtítulo",          type: "textarea" },
    { key: "ctaText",           label: "Texto del botón",    type: "input"    },
    { key: "ctaHref",           label: "Enlace del botón",   type: "url"      },
    { key: "backgroundImageUrl",label: "URL de imagen de fondo", type: "url"  },
  ],
  about: [
    { key: "heading",  label: "Título",        type: "input"    },
    { key: "body",     label: "Descripción",   type: "textarea" },
    { key: "photoUrl", label: "URL de foto",   type: "url"      },
    { key: "photoAlt", label: "Texto alt foto",type: "input"    },
  ],
  products: [
    { key: "heading",  label: "Título",     type: "input"    },
    { key: "subtitle", label: "Subtítulo",  type: "textarea" },
  ],
  gallery: [
    { key: "heading",  label: "Título",     type: "input"    },
    { key: "subtitle", label: "Subtítulo",  type: "textarea" },
  ],
  reviews: [
    { key: "heading",  label: "Título",     type: "input"    },
    { key: "subtitle", label: "Subtítulo",  type: "textarea" },
  ],
  booking_cta: [
    { key: "heading",  label: "Título",             type: "input"    },
    { key: "body",     label: "Descripción",         type: "textarea" },
    { key: "ctaText",  label: "Texto del botón",     type: "input"    },
    { key: "ctaHref",  label: "Enlace del botón",    type: "url"      },
  ],
  contact: [
    { key: "heading",  label: "Título",    type: "input"    },
    { key: "subtitle", label: "Subtítulo", type: "textarea" },
  ],
};

/** Props for the SectionEditor component. */
export interface SectionEditorProps {
  /** Section identifier. */
  sectionId: SectionId;
  /** Current content values merged with defaults. */
  initialContent: Record<string, unknown>;
  /** Called when the user successfully saves the section. */
  onSaved?: () => void;
}

/**
 * Admin editor form for a single landing page section.
 *
 * - Renders input/textarea fields based on SECTION_FIELDS.
 * - PATCHes /api/landing/[sectionId] on submit.
 * - Shows a success or error message after save.
 */
export function SectionEditor({ sectionId, initialContent, onSaved }: SectionEditorProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const { key } of SECTION_FIELDS[sectionId]) {
      init[key] = String(initialContent[key] ?? "");
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFeedback(null);
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/landing/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: values }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({ ok: false, msg: data.error ?? "Error al guardar" });
      } else {
        setFeedback({ ok: true, msg: "Sección guardada correctamente." });
        onSaved?.();
      }
    } catch {
      setFeedback({ ok: false, msg: "Error de conexión al guardar." });
    } finally {
      setSaving(false);
    }
  }

  const fields = SECTION_FIELDS[sectionId];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-text-primary">
        {SECTION_LABELS[sectionId]}
      </h2>

      {fields.map(({ key, label, type }) =>
        type === "textarea" ? (
          <Textarea
            key={key}
            label={label}
            rows={4}
            value={values[key] ?? ""}
            onChange={(e) => handleChange(key, e.target.value)}
            disabled={saving}
          />
        ) : (
          <Input
            key={key}
            label={label}
            type="text"
            value={values[key] ?? ""}
            onChange={(e) => handleChange(key, e.target.value)}
            disabled={saving}
          />
        )
      )}

      {feedback && (
        <p className={`text-sm ${feedback.ok ? "text-success" : "text-danger"}`}>
          {feedback.msg}
        </p>
      )}

      <Button type="submit" disabled={saving} loading={saving} size="sm">
        {saving ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
