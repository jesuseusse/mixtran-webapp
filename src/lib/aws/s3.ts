import { S3Client } from "@aws-sdk/client-s3";

/**
 * Shared S3Client singleton.
 * Import this in repositories and services that interact with S3.
 * Never instantiate S3Client directly in feature code.
 */
export const s3Client = new S3Client({
  region: process.env.NEXT_AWS_REGION ?? "us-east-1",
});
