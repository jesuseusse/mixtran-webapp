/**
 * Currency option stored in quote config and snapshotted on each quote.
 */
export interface CurrencyOption {
  code: string;   // "MXN"
  symbol: string; // "$"
  label: string;  // "Peso mexicano"
}

/**
 * Pre-built list of common Latin-American currencies.
 * Includes an "OTHER" sentinel for freetext entry.
 */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "MXN", symbol: "$",  label: "Peso mexicano" },
  { code: "USD", symbol: "$",  label: "Dólar estadounidense" },
  { code: "EUR", symbol: "€",  label: "Euro" },
  { code: "COP", symbol: "$",  label: "Peso colombiano" },
  { code: "VES", symbol: "Bs", label: "Bolívar venezolano" },
  { code: "ARS", symbol: "$",  label: "Peso argentino" },
  { code: "CLP", symbol: "$",  label: "Peso chileno" },
  { code: "PEN", symbol: "S/", label: "Sol peruano" },
  { code: "BRL", symbol: "R$", label: "Real brasileño" },
  { code: "OTHER", symbol: "", label: "Otra (manual)" },
];

/**
 * Business configuration used on every quote PDF.
 * Single-item table — PK is always "main".
 */
export interface QuoteConfig {
  configId: "main";
  businessName: string;
  taxId: string;
  /** Label shown on PDF: "RFC", "RIF", "NIT", etc. */
  taxIdLabel: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  currency: CurrencyOption;
  /** Default IVA percentage applied to new quotes. */
  ivaPercent: number;
  /** Default number of days a quote remains valid. */
  defaultValidityDays: number;
  /** Folio prefix, e.g. "COT-". */
  folioPrefix: string;
  /** Atomic counter — incremented per quote creation. */
  lastFolioNumber: number;
  defaultNotes?: string;
  termsText?: string;
  bankDetails?: string;
  updatedAt: string;
}

/** Input type for saving/updating config — excludes system-managed fields. */
export type UpdateQuoteConfigInput = Omit<QuoteConfig, "configId" | "lastFolioNumber" | "updatedAt">;
