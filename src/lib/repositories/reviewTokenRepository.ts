import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/aws/dynamodb";
import type { ReviewToken } from "@/lib/types/ReviewToken";

const TABLE = process.env.NEXT_DYNAMODB_TABLE_REVIEW_TOKENS!;

/**
 * Fetches a single review token by its UUID.
 * Returns undefined when the token does not exist.
 */
export async function findByToken(token: string): Promise<ReviewToken | undefined> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { token } })
  );
  return result.Item as ReviewToken | undefined;
}

/**
 * Persists a new review token record.
 * Overwrites any existing record with the same token (should not happen with UUIDs).
 */
export async function create(reviewToken: ReviewToken): Promise<void> {
  await docClient.send(new PutCommand({ TableName: TABLE, Item: reviewToken }));
}

/**
 * Marks a token as used so it cannot be submitted again.
 * Uses a conditional UpdateCommand — safe to call concurrently.
 */
export async function markUsed(token: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { token },
      UpdateExpression: "SET #used = :true",
      ExpressionAttributeNames: { "#used": "used" },
      ExpressionAttributeValues: { ":true": true },
    })
  );
}
