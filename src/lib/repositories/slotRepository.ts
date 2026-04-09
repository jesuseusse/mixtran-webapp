import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/aws/dynamodb";
import type { CalendarSlot } from "@/lib/types/Slot";
import type { CreateBookingInput, UpdateBookingStatusInput } from "@/lib/types/Booking";

const TABLE = process.env.NEXT_DYNAMODB_TABLE_SLOTS!;
const GSI = "date-startTime-index";

/** True when the error is a table or index not found — used to return [] instead of crashing. */
function isNotFound(err: unknown): boolean {
  const name = (err as Error)?.name ?? "";
  /* Log the exact table name and region so misconfigured env vars are obvious in the server log. */
  if (name === "ResourceNotFoundException") {
    console.warn(
      `[slotRepository] ResourceNotFoundException — TABLE="${TABLE}" REGION="${process.env.NEXT_AWS_REGION}". ` +
      "Check that NEXT_DYNAMODB_TABLE_SLOTS and NEXT_AWS_REGION match the actual AWS table."
    );
  }
  return name === "ResourceNotFoundException";
}

/**
 * Finds all available (isAvailable = true) slots for a specific date.
 * Uses the GSI when available; falls back to a Scan with filter expression.
 * The GSI (`date-startTime-index`) must be created on the table for optimal performance.
 */
export async function findAvailableByDate(date: string): Promise<CalendarSlot[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: GSI,
        KeyConditionExpression: "#date = :date",
        FilterExpression: "isAvailable = :true",
        ExpressionAttributeNames: { "#date": "date" },
        ExpressionAttributeValues: { ":date": date, ":true": true },
      })
    );
    return (result.Items ?? []) as CalendarSlot[];
  } catch (err) {
    if (!isNotFound(err)) throw err;
    /* Table or GSI missing — try Scan fallback. */
    return findAllByDateScan(date, true);
  }
}

/**
 * Finds all slots for a specific date regardless of availability.
 * Uses the GSI when available; falls back to a Scan with filter expression.
 */
export async function findAllByDate(date: string): Promise<CalendarSlot[]> {
  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: GSI,
        KeyConditionExpression: "#date = :date",
        ExpressionAttributeNames: { "#date": "date" },
        ExpressionAttributeValues: { ":date": date },
      })
    );
    return (result.Items ?? []) as CalendarSlot[];
  } catch (err) {
    if (!isNotFound(err)) throw err;
    /* Table or GSI missing — try Scan fallback. */
    return findAllByDateScan(date, false);
  }
}

/**
 * Fallback Scan when the GSI does not exist yet.
 * Returns [] if the table itself is missing (env var misconfiguration).
 * Acceptable at low data volumes (single admin calendar).
 * @internal
 */
async function findAllByDateScan(date: string, availableOnly: boolean): Promise<CalendarSlot[]> {
  try {
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE,
        FilterExpression: availableOnly
          ? "#date = :date AND isAvailable = :true"
          : "#date = :date",
        ExpressionAttributeNames: { "#date": "date" },
        ExpressionAttributeValues: availableOnly
          ? { ":date": date, ":true": true }
          : { ":date": date },
      })
    );
    return (result.Items ?? []) as CalendarSlot[];
  } catch (err) {
    /* Table does not exist — return empty rather than crashing the dashboard. */
    if (isNotFound(err)) return [];
    throw err;
  }
}

/**
 * Retrieves a single slot by its primary key.
 * Returns undefined if the slot does not exist.
 */
export async function findById(slotId: string): Promise<CalendarSlot | undefined> {
  const result = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { slotId } })
  );
  return result.Item as CalendarSlot | undefined;
}

/**
 * Creates a new available slot.
 * Will overwrite an existing slot with the same slotId.
 */
export async function create(slot: CalendarSlot): Promise<void> {
  await docClient.send(new PutCommand({ TableName: TABLE, Item: slot }));
}

/**
 * Writes multiple slots in a single batch operation.
 * DynamoDB limits 25 items per batch; caller must chunk if needed.
 */
export async function batchCreate(slots: CalendarSlot[]): Promise<void> {
  const requests = slots.map((slot) => ({ PutRequest: { Item: slot } }));
  await docClient.send(
    new BatchWriteCommand({ RequestItems: { [TABLE]: requests } })
  );
}

/**
 * Marks a slot as booked by embedding the contact data and setting isAvailable=false.
 * Called atomically within bookingService.createBooking.
 */
export async function bookSlot(input: CreateBookingInput): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { slotId: input.slotId },
      UpdateExpression:
        "SET isAvailable = :false, #status = :status, contactEmail = :email, #name = :name, phone = :phone, message = :msg, bookedAt = :now",
      ExpressionAttributeNames: { "#status": "status", "#name": "name" },
      ExpressionAttributeValues: {
        ":false": false,
        ":status": "pending",
        ":email": input.email,
        ":name": input.name,
        ":phone": input.phone,
        ":msg": input.message ?? "",
        ":now": new Date().toISOString(),
      },
    })
  );
}

/**
 * Updates the booking status (confirmed | cancelled) and optionally sets the meetLink.
 * Called from the admin bookings dashboard.
 */
export async function updateStatus(input: UpdateBookingStatusInput): Promise<void> {
  const updateParts = ["#status = :status"];
  const attrNames: Record<string, string> = { "#status": "status" };
  const attrValues: Record<string, unknown> = { ":status": input.status };

  if (input.meetLink) {
    updateParts.push("meetLink = :meetLink");
    attrValues[":meetLink"] = input.meetLink;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { slotId: input.slotId },
      UpdateExpression: `SET ${updateParts.join(", ")}`,
      ExpressionAttributeNames: attrNames,
      ExpressionAttributeValues: attrValues,
    })
  );
}

/**
 * Deletes a slot permanently.
 * Only used by admin to remove unbooked future slots.
 */
export async function remove(slotId: string): Promise<void> {
  await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { slotId } }));
}
