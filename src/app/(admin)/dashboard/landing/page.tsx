"use client";

import { useState, useEffect } from "react";
import { SectionEditor } from "@/components/admin/SectionEditor";
import { Spinner } from "@/components/ui";
import type { SectionId } from "@/lib/types/LandingSection";

/** Human-readable label for each section (duplicated here to avoid server import in client page). */
const SECTION_LABELS: Record<SectionId, string> = {
  hero: "Hero",
  about: "Nosotros",
  products: "Productos",
  gallery: "Galería",
  reviews: "Reseñas (encabezado)",
  booking_cta: "CTA de reservas",
  contact: "Contacto",
};

interface SectionData {
  sectionId: SectionId;
  content: Record<string, unknown>;
  updatedAt: string;
}

/**
 * Admin landing editor page — /dashboard/landing.
 *
 * Loads all 7 landing sections from /api/landing and renders an
 * inline SectionEditor form per section.
 * Saving a section PATCHes /api/landing/[sectionId] and triggers ISR revalidation.
 */
export default function LandingEditorPage() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<SectionId | null>(null);

  async function loadSections() {
    try {
      const res = await fetch("/api/landing");
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSections(data.data);
    } catch (err) {
      setError("No se pudieron cargar las secciones.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSections();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/5 px-6 py-4 text-sm text-danger">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
        Editor de landing
      </h1>
      <p className="mb-8 text-sm text-text-muted">
        Los cambios se publican en la página principal en segundos (ISR).
      </p>

      <div className="space-y-3">
        {sections.map((section) => {
          const isOpen = openSection === section.sectionId;
          return (
            <div
              key={section.sectionId}
              className="overflow-hidden rounded-lg border border-border bg-surface"
            >
              {/* ── Section header ─────────────────────────────────────── */}
              <button
                type="button"
                onClick={() =>
                  setOpenSection(isOpen ? null : section.sectionId)
                }
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-background transition-colors"
              >
                <div>
                  <span className="font-medium text-text-primary">
                    {SECTION_LABELS[section.sectionId]}
                  </span>
                  {section.updatedAt && (
                    <span className="ml-3 text-xs text-text-muted">
                      Actualizado{" "}
                      {new Date(section.updatedAt).toLocaleDateString("es-VE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
                {/* Chevron icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* ── Editor form (collapsed by default) ─────────────────── */}
              {isOpen && (
                <div className="border-t border-border px-5 py-5">
                  <SectionEditor
                    sectionId={section.sectionId}
                    initialContent={section.content}
                    onSaved={() => {
                      /* Refresh section list to update the "Actualizado" timestamp. */
                      loadSections();
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
