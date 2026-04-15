import { S3Client } from "@aws-sdk/client-s3";

/**
 * Shared S3Client singleton.
 * Import this in repositories and services that interact with S3.
 * Never instantiate S3Client directly in feature code.
 */
const credentials =
  process.env.NEXT_AWS_ACCESS_KEY_ID && process.env.NEXT_AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

export const s3Client = new S3Client({
  region: process.env.NEXT_AWS_REGION ?? "us-east-1",
  ...(credentials && { credentials }),
});
