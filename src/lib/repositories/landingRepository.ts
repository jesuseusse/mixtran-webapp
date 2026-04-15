import { GetCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "@/lib/aws/dynamodb";
import type { LandingSection, SectionId } from "@/lib/types/LandingSection";

const TABLE = process.env.NEXT_DYNAMODB_TABLE_LANDING!;

/**
 * Retrieves a single landing section by its sectionId.
 * Returns undefined when the section has not been saved in DynamoDB yet
 * (the landing page falls back to hardcoded defaults in that case).
 */
export async function findById(sectionId: SectionId): Promise<LandingSection | undefined> {
  if (!TABLE) {
    console.warn("[landingRepository] NEXT_DYNAMODB_TABLE_LANDING is not set. Returning undefined.");
    return undefined;
  }

  try {
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE, Key: { sectionId } })
    );
    return result.Item as LandingSection | undefined;
  } catch (err) {
    const name = (err as Error)?.name ?? "";
    if (name === "ResourceNotFoundException" || name === "AccessDeniedException") {
      console.warn(`[landingRepository] findById "${sectionId}" failed — ${name}. Returning undefined.`);
      return undefined;
    }
    throw err;
  }
}

/**
 * Returns all landing sections stored in DynamoDB.
 * At most 7 items (one per section) — a Scan is fine at this volume.
 * Returns [] when the table is empty, does not exist, or is not yet accessible
 * (missing env var, table not created, IAM not propagated) so hardcoded defaults
 * are used and the admin editor still loads.
 */
export async function findAll(): Promise<LandingSection[]> {
  if (!TABLE) {
    console.warn(
      "[landingRepository] NEXT_DYNAMODB_TABLE_LANDING is not set. Returning empty sections — hardcoded defaults will be used."
    );
    return [];
  }

  try {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    return (result.Items ?? []) as LandingSection[];
  } catch (err) {
    const name = (err as Error)?.name ?? "";
    const msg = (err as Error)?.message ?? "";

    if (name === "ResourceNotFoundException") {
      console.warn(
        `[landingRepository] Table "${TABLE}" not found. Returning empty sections — hardcoded defaults will be used.`
      );
      return [];
    }

    if (name === "AccessDeniedException") {
      console.warn(
        `[landingRepository] AccessDenied scanning "${TABLE}". Check IAM permissions on AmplifyConsoleServiceRole. Returning empty sections.`,
        msg
      );
      return [];
    }

    console.error(`[landingRepository] findAll failed — name=${name} message=${msg}`, err);
    throw err;
  }
}

/**
 * Creates or replaces a landing section.
 * Called from the admin editor whenever the user saves a section.
 */
export async function upsert(section: LandingSection): Promise<void> {
  await docClient.send(new PutCommand({ TableName: TABLE, Item: section }));
}
