import { randomUUID } from "crypto";
import * as quoteCatalogRepository from "@/lib/repositories/quoteCatalogRepository";
import type {
  QuoteCatalogItem,
  CreateCatalogItemInput,
  UpdateCatalogItemInput,
} from "@/lib/types/QuoteCatalogItem";

/**
 * Returns all catalog items sorted by usageCount descending (most-used first).
 */
export async function getAllItems(): Promise<QuoteCatalogItem[]> {
  const items = await quoteCatalogRepository.findAll();
  return items.sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Creates a new catalog item and persists it.
 */
export async function addItem(input: CreateCatalogItemInput): Promise<QuoteCatalogItem> {
  const now = new Date().toISOString();
  const item: QuoteCatalogItem = {
    productId: randomUUID(),
    name: input.name.trim(),
    description: input.description?.trim(),
    unit: input.unit.trim(),
    unitPrice: input.unitPrice,
    category: input.category?.trim(),
    usageCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await quoteCatalogRepository.create(item);
  return item;
}

/**
 * Updates a catalog item by its ID.
 * Returns the updated item, or null if not found.
 */
export async function updateItem(
  productId: string,
  input: UpdateCatalogItemInput
): Promise<QuoteCatalogItem | null> {
  return quoteCatalogRepository.update(productId, input);
}

/**
 * Permanently deletes a catalog item.
 */
export async function deleteItem(productId: string): Promise<void> {
  return quoteCatalogRepository.remove(productId);
}

/**
 * Ensures an item from a manually-typed quote line exists in the catalog.
 * If a matching name (case-insensitive) is found, updates it.
 * Otherwise creates a new entry with usageCount = 0.
 * Called after a quote is saved to auto-populate the catalog.
 */
export async function upsertFromQuoteItem(line: {
  productId?: string;
  name: string;
  unit: string;
  unitPrice: number;
}): Promise<void> {
  if (line.productId) {
    /* Already a known catalog item — just increment usage. */
    await quoteCatalogRepository.incrementUsage(line.productId);
    return;
  }

  /* Manual entry — look for an existing item with the same name. */
  const all = await quoteCatalogRepository.findAll();
  const existing = all.find(
    (i) => i.name.toLowerCase() === line.name.toLowerCase()
  );

  if (existing) {
    await quoteCatalogRepository.incrementUsage(existing.productId);
  } else {
    await addItem({
      name: line.name,
      unit: line.unit,
      unitPrice: line.unitPrice,
    });
  }
}
