"use client";

/** Props accepted by the Toggle component. */
export interface ToggleProps {
  /** Whether the toggle is currently on. */
  checked: boolean;
  /** Callback fired when the toggle is clicked. */
  onChange: (checked: boolean) => void;
  /** Optional label rendered beside the toggle. */
  label?: string;
  /** When true, prevents interaction and applies reduced opacity. */
  disabled?: boolean;
  /** Additional Tailwind classes applied to the root element. */
  className?: string;
}

/**
 * Accessible on/off toggle switch.
 *
 * Uses `role="switch"` and `aria-checked` for screen reader support.
 * All colors resolve through CSS variables.
 *
 * @example
 * <Toggle
 *   checked={isEnabled}
 *   onChange={setIsEnabled}
 *   label="Show section on landing"
 * />
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
}: ToggleProps) {
  return (
    <label
      className={[
        "inline-flex items-center gap-3 cursor-pointer select-none",
        disabled ? "opacity-50 pointer-events-none" : "",
        className,
      ].join(" ")}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          checked ? "bg-accent" : "bg-border",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-surface shadow-button",
            "transform transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
      {label && (
        <span className="text-sm text-text-primary">{label}</span>
      )}
    </label>
  );
}
