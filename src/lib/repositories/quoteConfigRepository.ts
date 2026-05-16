import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/aws/dynamodb";
import type { QuoteConfig, UpdateQuoteConfigInput } from "@/lib/types/QuoteConfig";

const TABLE = process.env.NEXT_DYNAMODB_TABLE_QUOTE_CONFIG!;

if (!TABLE) {
  console.error("[quoteConfigRepository] NEXT_DYNAMODB_TABLE_QUOTE_CONFIG is not set — all DynamoDB calls will fail");
}

/**
 * Fetches the single config item (PK = "main").
 * Returns null if the config has never been saved.
 */
export async function getConfig(): Promise<QuoteConfig | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { configId: "main" } })
  );
  return (result.Item as QuoteConfig) ?? null;
}

/**
 * Creates or fully replaces the config item.
 * Always writes configId = "main" and stamps updatedAt.
 */
export async function upsertConfig(input: UpdateQuoteConfigInput): Promise<QuoteConfig> {
  const existing = await getConfig();
  const config: QuoteConfig = {
    ...input,
    configId: "main",
    lastFolioNumber: existing?.lastFolioNumber ?? 0,
    updatedAt: new Date().toISOString(),
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: config }));
  return config;
}

/**
 * Atomically increments lastFolioNumber by 1 and returns the new value.
 * Uses DynamoDB ADD to prevent race conditions.
 */
export async function incrementFolioAndGet(): Promise<number> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { configId: "main" },
      UpdateExpression: "ADD lastFolioNumber :one",
      ExpressionAttributeValues: { ":one": 1 },
      ReturnValues: "UPDATED_NEW",
    })
  );
  return result.Attributes!.lastFolioNumber as number;
}
