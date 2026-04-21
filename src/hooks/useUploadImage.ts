"use client";

import { useState, useCallback } from "react";

/** Parameters for a single upload operation. */
export interface UploadImageParams {
  /** The file to upload. Should be compressed/cropped before passing here. */
  file: File;
  /**
   * Optional path prefix inside the S3 media folder.
   * Currently informational — the server generates the final key.
   * Kept in the signature for forward-compatibility.
   */
  path?: string;
  /** Desired file name (without extension — server may override). */
  filename?: string;
}

/** Return value of useUploadImage. */
export interface UseUploadImageReturn {
  /** Uploads the file via the presigned S3 flow. Resolves with the CloudFront public URL. */
  upload: (params: UploadImageParams) => Promise<string>;
  /** True while the upload (presign request + S3 PUT) is in flight. */
  uploading: boolean;
  /** Last error message, or null if the last upload succeeded. */
  error: string | null;
  /** Clears the last error. */
  clearError: () => void;
}

/**
 * Custom hook for uploading an image to S3 via the presigned PUT URL flow.
 *
 * Flow:
 *   1. POST {endpoint} → { uploadUrl, publicUrl }
 *   2. PUT file directly to S3 using uploadUrl
 *   3. Returns the CloudFront publicUrl
 *
 * No external upload library is used — the presigned URL approach means
 * the file bytes never pass through the Next.js server.
 *
 * @param endpoint - API route that returns { uploadUrl, publicUrl }.
 *   Defaults to /api/media/upload (admin, auth-gated).
 *   Pass /api/reviews/upload for the public review photo flow.
 */
export function useUploadImage(endpoint = "/api/media/upload"): UseUploadImageReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async ({ file }: UploadImageParams): Promise<string> => {
    setUploading(true);
    setError(null);

    try {
      /* Step 1 — get presigned URL from our API. */
      const presignRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });

      const presignData = await presignRes.json();

      if (!presignRes.ok || !presignData.success) {
        throw new Error(presignData.error ?? "Error al obtener la URL de carga");
      }

      const { uploadUrl, publicUrl } = presignData.data as {
        uploadUrl: string;
        publicUrl: string;
      };

      /* Step 2 — PUT the file directly to S3. */
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!s3Res.ok) {
        throw new Error(`Error al subir a S3 (${s3Res.status})`);
      }

      return publicUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir la imagen";
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [endpoint]);

  const clearError = useCallback(() => setError(null), []);

  return { upload, uploading, error, clearError };
}
