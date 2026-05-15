import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifySession } from "@/lib/auth/verifySession";
import { s3Client } from "@/lib/aws/s3";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

/**
 * POST /api/quotes/config/logo
 *
 * Admin only — generates an S3 presigned PUT URL for uploading a business logo.
 * Body: { fileName: string; contentType: string }
 * Response: { uploadUrl: string; publicUrl: string }
 */
export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const body = (await request.json()) as { fileName?: string; contentType?: string };

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

    if (!bucket) {
      return NextResponse.json(errorResponse("Configuración de S3 incompleta"), { status: 500 });
    }

    const ext = body.fileName.split(".").pop() ?? "jpg";
    const key = `quotes/logos/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: body.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
    const publicUrl = cdnBase ? `${cdnBase}/${key}` : uploadUrl;

    return NextResponse.json(successResponse({ uploadUrl, publicUrl }));
  } catch (err) {
    console.error("POST /api/quotes/config/logo error:", err);
    return NextResponse.json(errorResponse("Error al generar la URL de carga"), { status: 500 });
  }
}
