/**
 * migrate-cdn-urls.mjs
 *
 * One-time script — replaces an old CloudFront domain with a new one in all
 * DynamoDB tables that store CloudFront URLs:
 *   - paint-reviews      → photoUrl (top-level string attribute)
 *   - paint-landing-config → content (nested JSON object)
 *
 * Usage:
 *   OLD_DOMAIN=https://OLD.cloudfront.net \
 *   NEW_DOMAIN=https://NEW.cloudfront.net \
 *   node scripts/migrate-cdn-urls.mjs
 *
 * Uses your local AWS credentials (profile "mixtrain" or default).
 * Set AWS_PROFILE=mixtrain before running if needed.
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const OLD_DOMAIN = process.env.OLD_DOMAIN?.replace(/\/$/, "");
const NEW_DOMAIN = process.env.NEW_DOMAIN?.replace(/\/$/, "");

if (!OLD_DOMAIN || !NEW_DOMAIN) {
  console.error("Set OLD_DOMAIN and NEW_DOMAIN env vars before running.");
  process.exit(1);
}

const client = new DynamoDBClient({ region: "us-east-1" });
const db = DynamoDBDocumentClient.from(client);

// ── Helpers ──────────────────────────────────────────────────────────────────

function replaceInString(str) {
  return str.replaceAll(OLD_DOMAIN, NEW_DOMAIN);
}

/** Recursively replace OLD_DOMAIN in any string values within an object/array. */
function replaceInValue(value) {
  if (typeof value === "string") return replaceInString(value);
  if (Array.isArray(value)) return value.map(replaceInValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, replaceInValue(v)])
    );
  }
  return value;
}

// ── paint-reviews ─────────────────────────────────────────────────────────────

async function migrateReviews() {
  console.log("\n── paint-reviews ────────────────────────────────────");
  const { Items = [] } = await db.send(new ScanCommand({ TableName: "paint-reviews" }));

  let updated = 0;
  for (const item of Items) {
    if (!item.photoUrl?.includes(OLD_DOMAIN)) continue;

    const newUrl = replaceInString(item.photoUrl);
    await db.send(new UpdateCommand({
      TableName: "paint-reviews",
      Key: { reviewId: item.reviewId },
      UpdateExpression: "SET photoUrl = :url",
      ExpressionAttributeValues: { ":url": newUrl },
    }));
    console.log(`  ✓ ${item.reviewId}  ${item.photoUrl} → ${newUrl}`);
    updated++;
  }
  console.log(`  ${updated} of ${Items.length} reviews updated.`);
}

// ── paint-landing-config ──────────────────────────────────────────────────────

async function migrateLanding() {
  console.log("\n── paint-landing-config ─────────────────────────────");
  const { Items = [] } = await db.send(new ScanCommand({ TableName: "paint-landing-config" }));

  let updated = 0;
  for (const item of Items) {
    const raw = JSON.stringify(item.content ?? {});
    if (!raw.includes(OLD_DOMAIN)) continue;

    const newContent = replaceInValue(item.content);
    await db.send(new UpdateCommand({
      TableName: "paint-landing-config",
      Key: { sectionId: item.sectionId },
      UpdateExpression: "SET #c = :content",
      ExpressionAttributeNames: { "#c": "content" },
      ExpressionAttributeValues: { ":content": newContent },
    }));
    console.log(`  ✓ section "${item.sectionId}" updated.`);
    updated++;
  }
  console.log(`  ${updated} of ${Items.length} sections updated.`);
}

// ── Run ───────────────────────────────────────────────────────────────────────

console.log(`Replacing: ${OLD_DOMAIN}`);
console.log(`     with: ${NEW_DOMAIN}`);

await migrateReviews();
await migrateLanding();

console.log("\nDone. Update NEXT_S3_CLOUDFRONT_URL in Amplify Console if not already done.");
