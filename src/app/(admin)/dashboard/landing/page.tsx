"use client";

import { useState, useEffect } from "react";
import { SectionEditor } from "@/components/admin/SectionEditor";
import { GalleryEditor } from "@/components/admin/GalleryEditor";
import { Spinner, Toggle } from "@/components/ui";
import type { GalleryItem } from "@/components/landing/GallerySection";
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

interface SectionData {
  sectionId: SectionId;
  content: Record<string, unknown>;
  enabled: boolean;
  order: number;
  updatedAt: string;
}

/**
 * Admin landing editor page — /dashboard/landing.
 *
 * - Lists all 7 sections as collapsible accordion items.
 * - Each section has a visibility toggle and edit form.
 * - Gallery section renders the GalleryEditor (S3 upload) instead of a text form.
 * - Toggling enabled or changing order PATCHes /api/landing/[sectionId] immediately.
 */
export default function LandingEditorPage() {
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const [togglingId, setTogglingId] = useState<SectionId | null>(null);

  async function loadSections() {
    try {
      const res = await fetch("/api/landing");
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSections(data.data as SectionData[]);
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

  /** Toggles the enabled flag for a section immediately without opening the form. */
  async function handleToggle(sectionId: SectionId, enabled: boolean) {
    setTogglingId(sectionId);
    try {
      await fetch(`/api/landing/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      setSections((prev) =>
        prev.map((s) => (s.sectionId === sectionId ? { ...s, enabled } : s))
      );
    } finally {
      setTogglingId(null);
    }
  }

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

  /* Sort sections by current order value for display. */
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
        Editor de landing
      </h1>
      <p className="mb-8 text-sm text-text-muted">
        Los cambios se guardan de inmediato y serán visibles en la página principal en un máximo de 5 minutos.
        Activa o desactiva secciones con el toggle.
      </p>

      <div className="space-y-3">
        {sorted.map((section) => {
          const isOpen = openSection === section.sectionId;
          const isToggling = togglingId === section.sectionId;
          const galleryItems = (section.content.items ?? []) as GalleryItem[];

          return (
            <div
              key={section.sectionId}
              className={[
                "overflow-hidden rounded-lg border bg-surface transition-colors",
                section.enabled ? "border-border" : "border-border/50 opacity-60",
              ].join(" ")}
            >
              {/* ── Section header ─────────────────────────────────── */}
              <div className="flex w-full items-center gap-3 px-5 py-4">
                {/* Visibility toggle */}
                <Toggle
                  checked={section.enabled}
                  onChange={(v) => handleToggle(section.sectionId, v)}
                  disabled={isToggling}
                />

                {/* Collapse/expand trigger */}
                <button
                  type="button"
                  onClick={() =>
                    setOpenSection(isOpen ? null : section.sectionId)
                  }
                  className="flex flex-1 items-center justify-between text-left"
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
                    {!section.enabled && (
                      <span className="ml-3 text-xs text-warning">Oculta</span>
                    )}
                  </div>

                  {/* Chevron */}
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
              </div>

              {/* ── Editor form ────────────────────────────────────── */}
              {isOpen && (
                <div className="border-t border-border px-5 py-5">
                  {section.sectionId === "gallery" ? (
                    <GalleryEditor
                      initialItems={galleryItems}
                      onSaved={loadSections}
                    />
                  ) : (
                    <SectionEditor
                      sectionId={section.sectionId}
                      initialContent={section.content}
                      onSaved={loadSections}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
