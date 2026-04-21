"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import imageCompression from "browser-image-compression";
import { Button, Spinner } from "@/components/ui";
import { getCroppedImg, type CropArea } from "@/lib/utils/canvasUtils";
import { useUploadImage } from "@/hooks/useUploadImage";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Internal states of the uploader flow. */
type UploaderState = "initial" | "editor" | "preview";

/** Props accepted by ImageUploader. */
export interface ImageUploaderProps {
  /** Called with the CloudFront public URL after a successful upload. */
  onUploadComplete: (url: string) => void;
  /**
   * Optional callback invoked when the user clicks "Eliminar" in preview state.
   * If omitted, no delete button is shown.
   */
  onDelete?: () => void;
  /** Pre-existing URL to display in preview state on first render. */
  initialUrl?: string;
  /**
   * Desired crop aspect ratio (width / height).
   * - Provide a value (e.g. 1 for square, 16/9 for widescreen) to enable the
   *   crop editor before uploading.
   * - Omit (undefined) to skip cropping and upload the file directly.
   */
  aspectRatio?: number;
  /**
   * Options forwarded to browser-image-compression.
   * Defaults: maxSizeMB=1, maxWidthOrHeight=1920, useWebWorker=true.
   */
  compress?: Parameters<typeof imageCompression>[1];
  /** Label shown in the drop-zone. @default "Subir imagen" */
  label?: string;
  /**
   * API endpoint used to obtain the presigned S3 PUT URL.
   * Defaults to /api/media/upload (admin, auth-gated).
   * Pass /api/reviews/upload for the public review photo flow.
   */
  uploadEndpoint?: string;
  /** Additional Tailwind classes applied to the root element. */
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Allowed MIME types — must match /api/media/upload validation. */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const DEFAULT_COMPRESS_OPTIONS: Parameters<typeof imageCompression>[1] = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Three-state image uploader with optional crop-before-upload.
 *
 * States:
 *   INITIAL  → drop zone / file picker
 *   EDITOR   → react-easy-crop + zoom slider (only when aspectRatio is set)
 *   PREVIEW  → shows uploaded image with "Cambiar" / optional "Eliminar"
 *
 * If `aspectRatio` is undefined the component skips the EDITOR state and
 * uploads the compressed file directly, transitioning INITIAL → PREVIEW.
 *
 * The upload flow (presigned S3 PUT) is handled by `useUploadImage`.
 */
export function ImageUploader({
  onUploadComplete,
  onDelete,
  initialUrl,
  aspectRatio,
  compress,
  uploadEndpoint,
  label = "Subir imagen",
  className = "",
}: ImageUploaderProps) {
  const [state, setState] = useState<UploaderState>(initialUrl ? "preview" : "initial");
  const [previewUrl, setPreviewUrl] = useState<string>(initialUrl ?? "");

  /* Source object URL for the chosen file — used by the Cropper. */
  const [sourceSrc, setSourceSrc] = useState<string>("");

  /* Crop & zoom state managed by react-easy-crop. */
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  /* Local busy state for compress + upload phase. */
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { upload, uploading, error: uploadError } = useUploadImage(uploadEndpoint);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const error = localError ?? uploadError;
  const busy = processing || uploading;

  const compressOptions = { ...DEFAULT_COMPRESS_OPTIONS, ...compress };

  // ── Handlers ────────────────────────────────────────────────────────────

  /** Opens the native file picker. */
  const openPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /** Validates + loads the chosen file; advances to EDITOR or triggers direct upload. */
  const handleFileSelected = useCallback(
    async (file: File) => {
      setLocalError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setLocalError("Tipo de archivo no permitido. Usa JPEG, PNG, WebP o AVIF.");
        return;
      }

      if (aspectRatio !== undefined) {
        /* Show the crop editor. */
        const objectUrl = URL.createObjectURL(file);
        setSourceSrc(objectUrl);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setState("editor");
      } else {
        /* Skip crop — compress and upload immediately. */
        setProcessing(true);
        try {
          const compressed = await imageCompression(file, compressOptions);
          const compressedFile = new File([compressed], file.name, { type: compressed.type });
          const url = await upload({ file: compressedFile });
          setPreviewUrl(url);
          setState("preview");
          onUploadComplete(url);
        } catch {
          /* upload() already sets error via useUploadImage */
        } finally {
          setProcessing(false);
        }
      }
    },
    [aspectRatio, compressOptions, upload, onUploadComplete]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      /* Reset so the same file can be re-selected after an error. */
      e.target.value = "";
      if (file) handleFileSelected(file);
    },
    [handleFileSelected]
  );

  /** Drop-zone drag-over/drop handlers. */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelected(file);
    },
    [handleFileSelected]
  );

  /** Called by react-easy-crop when the user finishes adjusting the crop. */
  const onCropComplete = useCallback((_: unknown, pixels: CropArea) => {
    setCroppedAreaPixels(pixels);
  }, []);

  /** Crops, compresses, uploads, and transitions to PREVIEW. */
  const handleConfirmCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setProcessing(true);
    setLocalError(null);

    try {
      const cropped = await getCroppedImg(sourceSrc, croppedAreaPixels, 0.92, "image");
      const compressed = await imageCompression(cropped, compressOptions);
      const compressedFile = new File([compressed], cropped.name, { type: compressed.type });
      const url = await upload({ file: compressedFile });

      /* Release the object URL created for the source image. */
      URL.revokeObjectURL(sourceSrc);
      setSourceSrc("");

      setPreviewUrl(url);
      setState("preview");
      onUploadComplete(url);
    } catch {
      /* upload() sets uploadError; getCroppedImg errors are caught below */
      setLocalError("Error al procesar la imagen. Intenta de nuevo.");
    } finally {
      setProcessing(false);
    }
  }, [croppedAreaPixels, sourceSrc, compressOptions, upload, onUploadComplete]);

  /** Cancels the crop editor and returns to INITIAL state. */
  const handleCancelCrop = useCallback(() => {
    URL.revokeObjectURL(sourceSrc);
    setSourceSrc("");
    setLocalError(null);
    setState("initial");
  }, [sourceSrc]);

  /** Resets to INITIAL so the user can pick a new file. */
  const handleChange = useCallback(() => {
    setPreviewUrl("");
    setLocalError(null);
    setState("initial");
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={`relative ${className}`}>
      {/* ── Hidden file input (shared across all states) ────────────── */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={handleInputChange}
        disabled={busy}
        aria-label="Seleccionar imagen"
      />

      {/* ── INITIAL: drop zone ───────────────────────────────────────── */}
      {state === "initial" && (
        <button
          type="button"
          disabled={busy}
          onClick={openPicker}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-6 py-10 text-center transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-50"
          aria-label={label}
        >
          {busy ? (
            <>
              <Spinner size="md" />
              <span className="text-sm text-text-muted">Procesando…</span>
            </>
          ) : (
            <>
              {/* Upload icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-text-muted"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-sm font-medium text-text-primary">{label}</span>
              <span className="text-xs text-text-muted">
                Arrastra y suelta o haz clic — JPEG, PNG, WebP, AVIF
              </span>
            </>
          )}
        </button>
      )}

      {/* ── EDITOR: crop + zoom ──────────────────────────────────────── */}
      {state === "editor" && (
        <div className="flex flex-col gap-4">
          {/* Crop canvas area */}
          <div className="relative h-72 w-full overflow-hidden rounded-lg bg-black">
            <Cropper
              image={sourceSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-xs text-text-muted">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
              aria-label="Ajustar zoom"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCancelCrop}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={busy}
              onClick={handleConfirmCrop}
              disabled={!croppedAreaPixels || busy}
            >
              Recortar y subir
            </Button>
          </div>
        </div>
      )}

      {/* ── PREVIEW: uploaded image ──────────────────────────────────── */}
      {state === "preview" && (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Vista previa de la imagen subida"
            className="w-full rounded-lg object-cover"
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleChange}
            >
              Cambiar
            </Button>
            {onDelete && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={onDelete}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Error message (all states) ───────────────────────────────── */}
      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
