/**
 * Identifies each editable section of the landing page.
 * Matches the `sectionId` PK in the `paint-landing-config` DynamoDB table.
 */
export type SectionId =
  | "hero"
  | "about"
  | "products"
  | "gallery"
  | "reviews"
  | "booking_cta"
  | "contact";

/**
 * A single landing page section as stored in DynamoDB.
 * `content` holds the freeform JSON matching the component's prop shape.
 * `enabled` controls visibility on the public landing page.
 * `order` controls the render position (lower = higher on page).
 */
export interface LandingSection {
  /** Primary key — matches the section component identifier. */
  sectionId: SectionId;
  /** Section content — arbitrary JSON matching the component's prop shape. */
  content: Record<string, unknown>;
  /** When false, the section is hidden from the public landing page. @default true */
  enabled: boolean;
  /** Render position — lower numbers appear higher on the page. @default index 0-6 */
  order: number;
  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
}

/**
 * Resolved section data returned by landingService.getSections().
 * Includes content merged with defaults plus visibility/order metadata.
 */
export interface ResolvedSection {
  content: Record<string, unknown>;
  enabled: boolean;
  order: number;
}

/** Input for patching a section from the admin editor. */
export interface UpdateLandingSectionInput {
  sectionId: SectionId;
  /** Updated content fields — merged with existing content server-side. */
  content?: Record<string, unknown>;
  /** Override section visibility. */
  enabled?: boolean;
  /** Override render order. */
  order?: number;
}
