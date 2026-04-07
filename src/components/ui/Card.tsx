import { ReactNode } from "react";

/** Padding size applied to the card body. */
export type CardPadding = "none" | "sm" | "md" | "lg";

/** Props accepted by the Card component. */
export interface CardProps {
  /** Content rendered inside the card. */
  children: ReactNode;
  /** Internal padding of the card. @default "md" */
  padding?: CardPadding;
  /** When true, applies a subtle lift effect on hover. */
  hoverable?: boolean;
  /** Additional Tailwind classes. */
  className?: string;
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  none: "",
  sm:   "p-4",
  md:   "p-6",
  lg:   "p-8",
};

/**
 * Surface container with optional hover elevation effect.
 * Background, border, and radius all resolve through CSS variables.
 *
 * @example
 * <Card hoverable>
 *   <h3 className="text-text-primary font-semibold">Product</h3>
 *   <p className="text-text-secondary">Description</p>
 * </Card>
 */
export function Card({
  children,
  padding = "md",
  hoverable = false,
  className = "",
}: CardProps) {
  return (
    <div
      className={[
        "rounded-lg border border-border bg-surface shadow-card",
        PADDING_CLASSES[padding],
        hoverable
          ? "transition-shadow duration-200 hover:shadow-modal cursor-pointer"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
