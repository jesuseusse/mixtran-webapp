import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Shared DynamoDB DocumentClient singleton.
 * Import `docClient` in every repository — never create a new client per-request.
 */
const credentials =
  process.env.NEXT_AWS_ACCESS_KEY_ID && process.env.NEXT_AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

const raw = new DynamoDBClient({
  region: process.env.NEXT_AWS_REGION ?? "us-east-1",
  ...(credentials && { credentials }),
});

export const docClient = DynamoDBDocumentClient.from(raw, {
  marshallOptions: {
    /** Remove undefined values instead of failing on them. */
    removeUndefinedValues: true,
  },
});
