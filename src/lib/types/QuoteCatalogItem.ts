/**
 * A reusable product or service stored in the quote catalog.
 * Used for autocomplete in the quote wizard.
 */
export interface QuoteCatalogItem {
  productId: string;
  name: string;
  description?: string;
  /** Unit of measure: "pza", "lt", "kg", "m²", "hr", "svc", etc. */
  unit: string;
  /** Default suggested price — editable per quote line. */
  unitPrice: number;
  category?: string;
  /** Incremented each time the item is used in a quote — drives autocomplete ranking. */
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Input for creating a new catalog item. System fields are assigned by the service. */
export type CreateCatalogItemInput = Pick<
  QuoteCatalogItem,
  "name" | "description" | "unit" | "unitPrice" | "category"
>;

/** Partial input for updating an existing catalog item. */
export type UpdateCatalogItemInput = Partial<CreateCatalogItemInput>;
