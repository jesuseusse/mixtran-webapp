import { GetCommand, PutCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/aws/dynamodb";
import type { Contact, UpsertContactInput } from "@/lib/types/Contact";

const TABLE = process.env.NEXT_DYNAMODB_TABLE_CONTACTS!;

/**
 * Retrieves a contact by email.
 * Returns undefined if no record exists for this email.
 */
export async function findByEmail(email: string): Promise<Contact | undefined> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { email } })
  );
  return result.Item as Contact | undefined;
}

/**
 * Returns all contacts. Uses a Scan — acceptable at small CRM scale.
 * For large datasets, add a GSI and paginate.
 */
export async function findAll(): Promise<Contact[]> {
  const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
  return (result.Items ?? []) as Contact[];
}

/**
 * Creates a new contact record.
 * Use upsert() from booking flows to avoid overwriting existing records.
 */
export async function create(contact: Contact): Promise<void> {
  await docClient.send(new PutCommand({ TableName: TABLE, Item: contact }));
}

/**
 * Creates the contact if it does not exist, or increments totalBookings and
 * updates lastBookingAt if it does. Name and phone are only written on creation.
 *
 * This is a conditional put + update pattern: first we try to create, then update.
 * Safe to call concurrently — DynamoDB UpdateCommand with ADD is atomic.
 */
export async function upsert(input: UpsertContactInput): Promise<void> {
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { email: input.email },
      /* On first insert: set all fields. On subsequent bookings: only bump totalBookings and lastBookingAt. */
      UpdateExpression:
        "SET #name = if_not_exists(#name, :name), phone = if_not_exists(phone, :phone), " +
        "totalBookings = if_not_exists(totalBookings, :zero) + :one, " +
        "lastBookingAt = :now, " +
        "updatedAt = :now, " +
        "createdAt = if_not_exists(createdAt, :now)",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: {
        ":name": input.name,
        ":phone": input.phone,
        ":zero": 0,
        ":one": 1,
        ":now": now,
      },
    })
  );
}

/**
 * Applies partial admin-only updates (tags, notes, company) to a contact.
 */
export async function patch(
  email: string,
  fields: Partial<Pick<Contact, "tags" | "notes" | "company">>
): Promise<void> {
  const parts: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = { ":now": new Date().toISOString() };

  if (fields.tags !== undefined) {
    parts.push("tags = :tags");
    values[":tags"] = fields.tags;
  }
  if (fields.notes !== undefined) {
    parts.push("notes = :notes");
    values[":notes"] = fields.notes;
  }
  if (fields.company !== undefined) {
    parts.push("company = :company");
    values[":company"] = fields.company;
  }

  if (parts.length === 0) return;
  parts.push("updatedAt = :now");

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { email },
      UpdateExpression: `SET ${parts.join(", ")}`,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
    })
  );
}
