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
 * `content` is a freeform JSON blob whose shape matches the props
 * expected by the corresponding landing component.
 */
export interface LandingSection {
  /** Primary key — matches the section component identifier. */
  sectionId: SectionId;
  /** Section content — arbitrary JSON matching the component's prop shape. */
  content: Record<string, unknown>;
  /** ISO 8601 timestamp of the last update. */
  updatedAt: string;
}

/** Input for updating a section's content from the admin editor. */
export interface UpdateLandingSectionInput {
  sectionId: SectionId;
  content: Record<string, unknown>;
}
