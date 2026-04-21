import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/aws/s3";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { randomUUID } from "crypto";

/** Allowed image MIME types — must match ImageUploader validation. */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

/** Presigned URL expires in 10 minutes — enough for a single upload. */
const EXPIRES_IN_SECONDS = 600;

/**
 * POST /api/reviews/upload
 *
 * Public endpoint — no auth required. Generates an S3 presigned PUT URL
 * so the public review stepper (/resena/[token]) can upload a photo directly
 * to S3 without routing the bytes through the Next.js server.
 *
 * Files are stored under the `reviews/` S3 prefix, separate from admin media.
 *
 * Body: { fileName: string; contentType: "image/jpeg" | "image/png" | "image/webp" | "image/avif" }
 * Response: { uploadUrl: string; publicUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      fileName?: string;
      contentType?: string;
    };

    if (!body.fileName || !body.contentType) {
      return NextResponse.json(
        errorResponse("Los campos fileName y contentType son requeridos"),
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(body.contentType as AllowedType)) {
      return NextResponse.json(
        errorResponse("Tipo de archivo no permitido. Usa JPEG, PNG, WebP o AVIF."),
        { status: 400 }
      );
    }

    const bucket = process.env.NEXT_S3_BUCKET_NAME;
    const cdnBase = process.env.NEXT_S3_CLOUDFRONT_URL;

    if (!bucket || !cdnBase) {
      console.error("[reviews/upload] S3 env vars missing");
      return NextResponse.json(
        errorResponse("Configuración de almacenamiento incompleta"),
        { status: 500 }
      );
    }

    const ext = body.fileName.split(".").pop() ?? "jpg";
    const key = `reviews/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: body.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: EXPIRES_IN_SECONDS,
    });

    const publicUrl = `${cdnBase}/${key}`;

    return NextResponse.json(successResponse({ uploadUrl, publicUrl }));
  } catch (err) {
    const e = err as Error;
    console.error("[reviews/upload] FAILED —", e?.name, e?.message);
    return NextResponse.json(errorResponse("Error al generar la URL de carga"), { status: 500 });
  }
}
