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

    const bucket = process.env.NEXT_S3_BUCKET_NAME;
    const cdnBase = process.env.NEXT_S3_CLOUDFRONT_URL;
    const region = process.env.NEXT_AWS_REGION ?? "us-east-1";

    console.info("[media/upload] env check —", {
      NEXT_S3_BUCKET_NAME: bucket ?? "MISSING",
      NEXT_S3_CLOUDFRONT_URL: cdnBase ?? "MISSING",
      NEXT_AWS_REGION: region,
      fileName: body.fileName,
      contentType: body.contentType,
    });

    if (!bucket) {
      console.error("[media/upload] NEXT_S3_BUCKET_NAME is not set");
      return NextResponse.json(errorResponse("Configuración de S3 incompleta (bucket)"), { status: 500 });
    }
    if (!cdnBase) {
      console.error("[media/upload] NEXT_S3_CLOUDFRONT_URL is not set");
      return NextResponse.json(errorResponse("Configuración de S3 incompleta (CDN URL)"), { status: 500 });
    }

    /* Generate a unique key so uploads never overwrite existing files. */
    const ext = body.fileName.split(".").pop() ?? "jpg";
    const key = `media/${randomUUID()}.${ext}`;

    console.info(`[media/upload] generating presigned URL — bucket=${bucket} key=${key}`);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: body.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: EXPIRES_IN_SECONDS,
    });

    const publicUrl = `${cdnBase}/${key}`;
    console.info(`[media/upload] presigned URL generated — publicUrl=${publicUrl}`);

    return NextResponse.json(successResponse({ uploadUrl, publicUrl }));
  } catch (err) {
    const e = err as Error;
    console.error("[media/upload] FAILED —", e?.name, e?.message, e);
    return NextResponse.json(errorResponse("Error al generar la URL de carga"), { status: 500 });
  }
}
