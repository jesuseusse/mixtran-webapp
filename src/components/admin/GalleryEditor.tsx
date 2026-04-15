"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui";
import { ImageUploader } from "@/components/ui";
import type { GalleryItem } from "@/components/landing/GallerySection";

/** Props accepted by GalleryEditor. */
export interface GalleryEditorProps {
  /** Current gallery items stored in DynamoDB. */
  initialItems: GalleryItem[];
  /** Called with the updated items list after any change so the parent can re-fetch. */
  onSaved?: () => void;
}

/**
 * Admin gallery manager for the landing page gallery section.
 *
 * - Lists existing gallery images with delete controls.
 * - Uses ImageUploader (crop → compress → S3 presigned PUT) to add new items.
 * - PATCHes /api/landing/gallery with the updated items list after each change.
 */
export function GalleryEditor({ initialItems, onSaved }: GalleryEditorProps) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Incremented after each upload so ImageUploader remounts in its initial state. */
  const [uploaderKey, setUploaderKey] = useState(0);

  /** Persists the current items list to DynamoDB via PATCH /api/landing/gallery. */
  async function persistItems(updated: GalleryItem[]) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/landing/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: { items: updated } }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "Error al guardar");
      setItems(updated);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la galería");
    } finally {
      setSaving(false);
    }
  }

  /**
   * Called by ImageUploader after a successful upload.
   * Appends the new item and persists.
   */
  async function handleUploaded(url: string) {
    const newItem: GalleryItem = {
      id: crypto.randomUUID(),
      url,
      /* Derive a reasonable alt text from the URL's last segment. */
      alt: url.split("/").pop()?.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") ?? "imagen",
    };
    await persistItems([...items, newItem]);
    /* Reset the uploader back to the drop zone so another image can be added immediately. */
    setUploaderKey((k) => k + 1);
  }

  /** Removes an item from the list and persists. */
  async function handleDelete(id: string) {
    await persistItems(items.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-5">
      {/* ── Upload new image ───────────────────────────────────────── */}
      <ImageUploader
        key={uploaderKey}
        onUploadComplete={handleUploaded}
        aspectRatio={1}
        label="Agregar imagen a la galería"
        compress={{ maxSizeMB: 0.8, maxWidthOrHeight: 1200, useWebWorker: true }}
      />

      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      {/* ── Existing items ────────────────────────────────────────── */}
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">No hay imágenes en la galería.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-background"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.alt}
                className="aspect-square w-full object-cover"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDelete(item.id)}
                  className="w-full bg-danger px-3 py-2 text-xs font-medium text-on-danger transition-colors hover:bg-danger/80 disabled:opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {saving && (
        <p className="flex items-center gap-2 text-xs text-text-muted">
          <Spinner size="sm" /> Guardando…
        </p>
      )}
    </div>
  );
}
