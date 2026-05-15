import * as quoteConfigRepository from "@/lib/repositories/quoteConfigRepository";
import type { QuoteConfig, UpdateQuoteConfigInput } from "@/lib/types/QuoteConfig";

/**
 * Returns the current quote config, or null if it has never been saved.
 */
export async function getConfig(): Promise<QuoteConfig | null> {
  return quoteConfigRepository.getConfig();
}

/**
 * Saves (or fully replaces) the quote config.
 */
export async function saveConfig(input: UpdateQuoteConfigInput): Promise<QuoteConfig> {
  return quoteConfigRepository.upsertConfig(input);
}

/**
 * Atomically increments the folio counter and returns a formatted folio number.
 * Throws QUOTE_CONFIG_MISSING if config has not been set up.
 * Format: `${prefix}${String(n).padStart(4, '0')}` — e.g. "COT-0001".
 */
export async function getNextFolioNumber(): Promise<string> {
  const config = await quoteConfigRepository.getConfig();
  if (!config) {
    throw Object.assign(new Error("Quote config not set up"), {
      code: "QUOTE_CONFIG_MISSING",
    });
  }
  const n = await quoteConfigRepository.incrementFolioAndGet();
  return `${config.folioPrefix}${String(n).padStart(4, "0")}`;
}
