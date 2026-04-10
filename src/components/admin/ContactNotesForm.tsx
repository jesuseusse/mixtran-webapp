"use client";

import { useState, FormEvent } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Snackbar } from "@/components/ui/Snackbar";
import { Spinner } from "@/components/ui/Spinner";

/** Props for ContactNotesForm. */
export interface ContactNotesFormProps {
  /** Email address — used as the API key. */
  email: string;
  /** Current notes value. */
  initialNotes: string;
  /** Current tags array. */
  initialTags: string[];
  /** Current company name. */
  initialCompany: string;
}

/**
 * Admin form for editing contact notes, tags, and company.
 * PATCHes /api/contacts/[email] on save.
 */
export function ContactNotesForm({
  email,
  initialNotes,
  initialTags,
  initialCompany,
}: ContactNotesFormProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [company, setCompany] = useState(initialCompany);
  /* Tags are stored as comma-separated input for simplicity. */
  const [tagsInput, setTagsInput] = useState(initialTags.join(", "));
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: "", type: "success" as "success" | "error" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/contacts/${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, company, tags }),
      });
      const json = await res.json();

      if (json.success) {
        setSnackbar({ visible: true, message: "Contacto actualizado", type: "success" });
      } else {
        setSnackbar({ visible: true, message: json.error ?? "Error al guardar", type: "error" });
      }
    } catch {
      setSnackbar({ visible: true, message: "Error de conexión", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-border bg-surface p-6 shadow-card space-y-5"
      >
        <h2 className="font-heading text-lg font-semibold text-text-primary">
          Notas y etiquetas
        </h2>

        <Input
          label="Empresa (opcional)"
          type="text"
          placeholder="Nombre de empresa"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />

        <div>
          <label className="mb-1 block text-sm font-semibold text-text-primary">
            Etiquetas
          </label>
          <input
            type="text"
            placeholder="cliente-frecuente, arquitecto, constructor"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-text-muted">Separadas por comas</p>
        </div>

        <Textarea
          label="Notas internas"
          rows={4}
          placeholder="Notas visibles solo para el administrador…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-button transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {saving && <Spinner size="sm" />}
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </>
  );
}
