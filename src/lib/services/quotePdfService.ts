import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/aws/s3";
import { QuoteDocument } from "@/lib/pdf/QuoteDocument";
import * as quoteRepository from "@/lib/repositories/quoteRepository";
import * as quoteConfigService from "@/lib/services/quoteConfigService";

const BUCKET = process.env.NEXT_S3_BUCKET_NAME!;
const CDN = process.env.NEXT_S3_CLOUDFRONT_URL!;
/** Pre-signed download URL valid for 10 minutes. */
const TTL_SECONDS = 600;

/**
 * Generates a PDF for the given quote, uploads it to S3, updates the quote
 * record with the S3 key, and returns a pre-signed CloudFront/S3 download URL.
 *
 * Throws if the quote or config is not found.
 */
export async function generateAndUpload(quoteId: string): Promise<string> {
  const [quote, config] = await Promise.all([
    quoteRepository.findById(quoteId),
    quoteConfigService.getConfig(),
  ]);

  if (!quote) throw new Error(`quotePdfService: quote not found — ${quoteId}`);
  if (!config) {
    throw Object.assign(new Error("Quote config not set up"), {
      code: "QUOTE_CONFIG_MISSING",
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(QuoteDocument as any, { quote, config });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  const s3Key = `quotes/pdfs/${quoteId}.pdf`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: "application/pdf",
    })
  );

  await quoteRepository.updatePdfKey(quoteId, s3Key);

  /* If CloudFront is configured, return a direct public URL. */
  if (CDN) {
    return `${CDN}/${s3Key}`;
  }

  /* Fallback: pre-signed S3 URL valid for 10 minutes. */
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: s3Key });
  return getSignedUrl(s3Client, cmd, { expiresIn: TTL_SECONDS });
}
