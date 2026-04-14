import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { verifySession } from "@/lib/auth/verifySession";
import { s3Client } from "@/lib/aws/s3";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import { randomUUID } from "crypto";

/** Allowed image MIME types for media uploads. */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

/** Presigned URL expires in 10 minutes — enough for a single upload. */
const EXPIRES_IN_SECONDS = 600;

/**
 * POST /api/media/upload
 *
 * Admin only — generates an S3 presigned PUT URL for a media file.
 * The client uploads the file directly to S3 using the returned URL,
 * then stores the CloudFront URL in the landing section content.
 *
 * Body: { fileName: string; contentType: "image/jpeg" | "image/png" | "image/webp" | "image/avif" }
 *
 * Response: { uploadUrl: string; publicUrl: string }
 * - uploadUrl: presigned S3 PUT URL (valid for 10 min)
 * - publicUrl: final CloudFront URL to store in DynamoDB
 */
export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

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

    const bucket = process.env.NEXT_S3_BUCKET!;
    const cdnBase = process.env.NEXT_S3_CLOUDFRONT_URL!;

    /* Generate a unique key so uploads never overwrite existing files. */
    const ext = body.fileName.split(".").pop() ?? "jpg";
    const key = `media/${randomUUID()}.${ext}`;

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
    console.error("POST /api/media/upload error:", err);
    return NextResponse.json(errorResponse("Error al generar la URL de carga"), { status: 500 });
  }
}
