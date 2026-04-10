import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/aws/dynamodb";
import type { Review, ReviewStatus } from "@/lib/types/Review";

const TABLE = process.env.NEXT_DYNAMODB_TABLE_REVIEWS!;
const GSI = "status-createdAt-index";

/**
 * Retrieves a single review by its primary key.
 * Returns undefined if not found.
 */
export async function findById(reviewId: string): Promise<Review | undefined> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { reviewId } })
  );
  return result.Item as Review | undefined;
}

/**
 * Returns all reviews with a given status, sorted by createdAt descending (newest first).
 * Uses the GSI `status-createdAt-index`.
 */
export async function findByStatus(status: ReviewStatus): Promise<Review[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: GSI,
      KeyConditionExpression: "#status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
      /* Scan backwards to get newest first. */
      ScanIndexForward: false,
    })
  );
  return (result.Items ?? []) as Review[];
}

/**
 * Persists a new review with status="pending".
 * Will overwrite an existing review with the same reviewId.
 */
export async function create(review: Review): Promise<void> {
  await docClient.send(new PutCommand({ TableName: TABLE, Item: review }));
}

/**
 * Updates the moderation status of a review (approved | rejected).
 * Also updates contactEmail if provided (linking to an existing contact).
 */
export async function updateStatus(
  reviewId: string,
  status: ReviewStatus,
  contactEmail?: string
): Promise<void> {
  const parts = ["#status = :status"];
  const names: Record<string, string> = { "#status": "status" };
  const values: Record<string, unknown> = { ":status": status };

  if (contactEmail) {
    parts.push("contactEmail = :email");
    values[":email"] = contactEmail;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { reviewId },
      UpdateExpression: `SET ${parts.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

/**
 * Permanently deletes a review. Admin only.
 */
export async function remove(reviewId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({ TableName: TABLE, Key: { reviewId } })
  );
}
