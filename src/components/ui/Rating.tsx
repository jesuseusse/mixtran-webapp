"use client";

/** Size of the star icons. */
export type RatingSize = "sm" | "md";

/** Props accepted by the Rating component. */
export interface RatingProps {
  /** Current rating value between 1 and 5. */
  value: number;
  /**
   * Callback fired when the user selects a star.
   * Omit to render the component in read-only mode.
   */
  onChange?: (value: number) => void;
  /** Size of the star icons. @default "md" */
  size?: RatingSize;
  /** Additional Tailwind classes applied to the root element. */
  className?: string;
}

const SIZE_CLASSES: Record<RatingSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
};

/**
 * Star rating component. Renders 5 stars.
 *
 * - **Read-only**: omit `onChange`. Stars are non-interactive.
 * - **Interactive**: provide `onChange`. Hovering previews the rating.
 *
 * @example
 * // Read-only
 * <Rating value={4} />
 *
 * // Interactive
 * <Rating value={rating} onChange={setRating} />
 */
export function Rating({ value, onChange, size = "md", className = "" }: RatingProps) {
  const isInteractive = typeof onChange === "function";

  return (
    <div
      role={isInteractive ? "group" : undefined}
      aria-label={isInteractive ? "Rating" : `Rating: ${value} out of 5`}
      className={`inline-flex gap-0.5 ${className}`}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= value;

        return (
          <button
            key={starValue}
            type="button"
            disabled={!isInteractive}
            onClick={() => onChange?.(starValue)}
            aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
            aria-pressed={filled}
            className={[
              SIZE_CLASSES[size],
              "transition-colors",
              filled ? "text-accent" : "text-border",
              isInteractive
                ? "cursor-pointer hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded-sm"
                : "cursor-default pointer-events-none",
            ].join(" ")}
          >
            {/* Solid star SVG — no icon library dependency */}
            <svg
              viewBox="0 0 24 24"
              fill={filled ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="w-full h-full"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
