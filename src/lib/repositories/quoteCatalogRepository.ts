import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/aws/dynamodb";
import type {
  QuoteCatalogItem,
  UpdateCatalogItemInput,
} from "@/lib/types/QuoteCatalogItem";

const TABLE = process.env.NEXT_DYNAMODB_TABLE_QUOTE_CATALOG!;

/**
 * Returns all catalog items. Sorted by usageCount descending by the caller.
 * Catalog is expected to stay small — no pagination needed initially.
 */
export async function findAll(): Promise<QuoteCatalogItem[]> {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
  return (result.Items ?? []) as QuoteCatalogItem[];
}

/**
 * Fetches a single catalog item by its primary key.
 * Returns null if not found.
 */
export async function findById(productId: string): Promise<QuoteCatalogItem | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { productId } })
  );
  return (result.Item as QuoteCatalogItem) ?? null;
}

/**
 * Persists a new catalog item. Overwrites if productId already exists.
 */
export async function create(item: QuoteCatalogItem): Promise<void> {
  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
}

/**
 * Applies a partial update to an existing catalog item.
 */
export async function update(
  productId: string,
  input: UpdateCatalogItemInput
): Promise<QuoteCatalogItem | null> {
  const item = await findById(productId);
  if (!item) return null;

  const updated: QuoteCatalogItem = {
    ...item,
    ...Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    ),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: updated }));
  return updated;
}

/**
 * Permanently deletes a catalog item.
 */
export async function remove(productId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({ TableName: TABLE, Key: { productId } })
  );
}

/**
 * Atomically increments usageCount by 1.
 * Called each time the item is used in a saved quote.
 */
export async function incrementUsage(productId: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { productId },
      UpdateExpression: "ADD usageCount :one",
      ExpressionAttributeValues: { ":one": 1 },
    })
  );
}
