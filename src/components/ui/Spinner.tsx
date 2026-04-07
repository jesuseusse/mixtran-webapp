"use client";

/** Size of the spinner. */
export type SpinnerSize = "sm" | "md" | "lg";

/** Props accepted by the Spinner component. */
export interface SpinnerProps {
  /** Size variant. @default "md" */
  size?: SpinnerSize;
  /** Additional Tailwind classes (e.g. `text-on-primary`). */
  className?: string;
}

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

/**
 * Animated loading spinner. Color is controlled via `currentColor`,
 * so pass a text color class (`text-on-primary`, `text-accent`, etc.)
 * to match the surrounding context.
 *
 * @example
 * <Spinner size="sm" className="text-on-primary" />
 * <Spinner size="lg" className="text-accent" />
 */
export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${SIZE_CLASSES[size]} ${className}`}
    />
  );
}
