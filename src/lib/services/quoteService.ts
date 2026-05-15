import { randomUUID } from "crypto";
import * as quoteRepository from "@/lib/repositories/quoteRepository";
import * as quoteConfigService from "@/lib/services/quoteConfigService";
import * as quoteCatalogService from "@/lib/services/quoteCatalogService";
import type {
  Quote,
  QuoteItem,
  QuoteListFilters,
  QuoteStatus,
  CreateQuoteInput,
  UpdateQuoteInput,
} from "@/lib/types/Quote";

// ---------------------------------------------------------------------------
// Pure computation helpers — no DB calls
// ---------------------------------------------------------------------------

/**
 * Computes the line total for a single quote item.
 * lineTotal = quantity * unitPrice * (1 - discountPercent / 100)
 */
export function computeLineTotal(item: Pick<QuoteItem, "quantity" | "unitPrice" | "discountPercent">): number {
  return item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
}

/**
 * Computes subtotal, IVA amount, and total from a list of items.
 */
export function computeTotals(
  items: QuoteItem[],
  ivaPercent: number
): { subtotal: number; ivaAmount: number; total: number } {
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const ivaAmount = subtotal * (ivaPercent / 100);
  const total = subtotal + ivaAmount;
  return { subtotal, ivaAmount, total };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Returns quotes matching the provided filters.
 */
export async function getQuotes(filters: QuoteListFilters = {}): Promise<Quote[]> {
  return quoteRepository.findAll(filters);
}

/**
 * Returns a single quote by ID.
 * Throws if not found.
 */
export async function getQuote(quoteId: string): Promise<Quote> {
  const quote = await quoteRepository.findById(quoteId);
  if (!quote) throw new Error(`quoteService.getQuote: not found — ${quoteId}`);
  return quote;
}

/**
 * Creates a new quote.
 * Throws QUOTE_CONFIG_MISSING if the business config has not been set up.
 * Auto-populates the catalog from any manually-typed line items.
 */
export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const config = await quoteConfigService.getConfig();
  if (!config) {
    throw Object.assign(new Error("Quote config not set up"), {
      code: "QUOTE_CONFIG_MISSING",
    });
  }

  const quoteNumber = await quoteConfigService.getNextFolioNumber();
  const { subtotal, ivaAmount, total } = computeTotals(input.items, input.ivaPercent);

  const now = new Date().toISOString();
  const quote: Quote = {
    ...input,
    quoteId: randomUUID(),
    quoteNumber,
    subtotal,
    ivaAmount,
    total,
    createdAt: now,
    updatedAt: now,
  };

  await quoteRepository.create(quote);

  /* Auto-upsert catalog from line items (fire-and-forget, don't block response). */
  void Promise.allSettled(
    input.items.map((item) =>
      quoteCatalogService.upsertFromQuoteItem({
        productId: item.productId,
        name: item.name,
        unit: item.unit,
        unitPrice: item.unitPrice,
      })
    )
  );

  return quote;
}

/**
 * Updates an existing quote and recomputes totals.
 * Returns the updated quote, or throws if not found.
 */
export async function updateQuote(
  quoteId: string,
  input: UpdateQuoteInput
): Promise<Quote> {
  const existing = await quoteRepository.findById(quoteId);
  if (!existing) throw new Error(`quoteService.updateQuote: not found — ${quoteId}`);

  /* Recompute totals if items or ivaPercent changed. */
  const items = input.items ?? existing.items;
  const ivaPercent = input.ivaPercent ?? existing.ivaPercent;
  const { subtotal, ivaAmount, total } = computeTotals(items, ivaPercent);

  const updated = await quoteRepository.update(quoteId, {
    ...input,
    subtotal,
    ivaAmount,
    total,
  });

  if (!updated) throw new Error(`quoteService.updateQuote: update failed — ${quoteId}`);
  return updated;
}

/**
 * Permanently deletes a quote.
 */
export async function deleteQuote(quoteId: string): Promise<void> {
  const existing = await quoteRepository.findById(quoteId);
  if (!existing) throw new Error(`quoteService.deleteQuote: not found — ${quoteId}`);
  await quoteRepository.remove(quoteId);
}

/**
 * Transitions a quote to a new status.
 * Returns the updated quote.
 */
export async function updateStatus(quoteId: string, status: QuoteStatus): Promise<Quote> {
  const updated = await quoteRepository.updateStatus(quoteId, status);
  if (!updated) throw new Error(`quoteService.updateStatus: not found — ${quoteId}`);
  return updated;
}
