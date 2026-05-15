import type { CurrencyOption } from "./QuoteConfig";

export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

/**
 * A single line item within a quote.
 */
export interface QuoteItem {
  /** Stable UUID used as React key. */
  lineId: string;
  /** Null when the item was typed manually (not from catalog). */
  productId?: string;
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  /** Per-line discount 0–100. No global discount. */
  discountPercent: number;
  /** quantity * unitPrice * (1 - discountPercent / 100) */
  lineTotal: number;
}

/**
 * A complete quote document stored in DynamoDB.
 */
export interface Quote {
  quoteId: string;
  quoteNumber: string;
  status: QuoteStatus;
  clientName: string;
  clientCompany?: string;
  clientTaxId?: string;
  /** Optional — never required. */
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  items: QuoteItem[];
  subtotal: number;
  /** Snapshot of config IVA at creation time. */
  ivaPercent: number;
  ivaAmount: number;
  total: number;
  /** Snapshot of config currency at creation time. */
  currency: CurrencyOption;
  /** ISO date string. */
  validUntil: string;
  notes?: string;
  pdfS3Key?: string;
  pdfGeneratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a quote — system-computed fields excluded. */
export type CreateQuoteInput = Omit<
  Quote,
  | "quoteId"
  | "quoteNumber"
  | "subtotal"
  | "ivaAmount"
  | "total"
  | "pdfS3Key"
  | "pdfGeneratedAt"
  | "createdAt"
  | "updatedAt"
>;

/** Partial update — any subset of CreateQuoteInput plus an optional status override. */
export type UpdateQuoteInput = Partial<CreateQuoteInput> & { status?: QuoteStatus };

/** Filters for the quote list endpoint. */
export interface QuoteListFilters {
  status?: QuoteStatus;
  /** Matches clientName or quoteNumber (case-insensitive, client-side). */
  search?: string;
  /** ISO date lower bound (inclusive). */
  from?: string;
  /** ISO date upper bound (inclusive). */
  to?: string;
}
