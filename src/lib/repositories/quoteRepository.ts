import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/aws/dynamodb";
import type { Quote, QuoteListFilters, QuoteStatus, UpdateQuoteInput } from "@/lib/types/Quote";

const TABLE = process.env.NEXT_DYNAMODB_TABLE_QUOTES!;
const GSI = "status-createdAt-index";

/**
 * Returns quotes matching the provided filters.
 * Status filter uses the GSI; otherwise performs a full scan.
 * text/date filtering is applied in-memory after fetching.
 */
export async function findAll(filters: QuoteListFilters = {}): Promise<Quote[]> {
  let items: Quote[];

  if (filters.status) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: GSI,
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":status": filters.status },
        ScanIndexForward: false,
      })
    );
    items = (result.Items ?? []) as Quote[];
  } else {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    items = (result.Items ?? []) as Quote[];
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (q2) =>
        q2.clientName.toLowerCase().includes(q) ||
        q2.quoteNumber.toLowerCase().includes(q)
    );
  }

  if (filters.from) {
    items = items.filter((q) => q.createdAt >= filters.from!);
  }

  if (filters.to) {
    /* Include the full "to" day by appending T23:59:59. */
    items = items.filter((q) => q.createdAt <= `${filters.to}T23:59:59`);
  }

  return items;
}

/**
 * Fetches a single quote by its primary key.
 * Returns null if not found.
 */
export async function findById(quoteId: string): Promise<Quote | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { quoteId } })
  );
  return (result.Item as Quote) ?? null;
}

/**
 * Persists a new quote. Overwrites if quoteId already exists.
 */
export async function create(quote: Quote): Promise<void> {
  await docClient.send(new PutCommand({ TableName: TABLE, Item: quote }));
}

/**
 * Applies a partial update to an existing quote.
 * Returns the updated quote, or null if not found.
 */
export async function update(
  quoteId: string,
  input: UpdateQuoteInput | Partial<Quote>
): Promise<Quote | null> {
  const existing = await findById(quoteId);
  if (!existing) return null;

  const updated: Quote = {
    ...existing,
    ...Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    ),
    updatedAt: new Date().toISOString(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: updated }));
  return updated;
}

/**
 * Permanently deletes a quote.
 */
export async function remove(quoteId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({ TableName: TABLE, Key: { quoteId } })
  );
}

/**
 * Updates the S3 key and timestamp after PDF generation.
 */
export async function updatePdfKey(quoteId: string, key: string): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { quoteId },
      UpdateExpression: "SET pdfS3Key = :key, pdfGeneratedAt = :ts, updatedAt = :ts",
      ExpressionAttributeValues: {
        ":key": key,
        ":ts": new Date().toISOString(),
      },
    })
  );
}

/**
 * Updates only the status field of a quote.
 */
export async function updateStatus(quoteId: string, status: QuoteStatus): Promise<Quote | null> {
  const existing = await findById(quoteId);
  if (!existing) return null;

  const updated: Quote = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };
  await docClient.send(new PutCommand({ TableName: TABLE, Item: updated }));
  return updated;
}
