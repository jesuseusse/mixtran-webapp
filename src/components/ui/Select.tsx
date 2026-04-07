"use client";

import { forwardRef, SelectHTMLAttributes } from "react";

/** A single option entry rendered inside the select. */
export interface SelectOption {
  /** The option value submitted with the form. */
  value: string;
  /** The human-readable label displayed to the user. */
  label: string;
}

/** Props accepted by the Select component. */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Visible label rendered above the select. */
  label?: string;
  /** Error message rendered below the select in danger color. */
  error?: string;
  /** List of options to display. */
  options: SelectOption[];
  /** Placeholder text shown as the first disabled option. */
  placeholder?: string;
  /** Additional Tailwind classes applied to the `<select>` element. */
  className?: string;
}

/**
 * Accessible select dropdown with optional label and error.
 * Forwards the ref to the underlying `<select>` element.
 *
 * @example
 * <Select
 *   label="Service type"
 *   options={[
 *     { value: "interior", label: "Interior painting" },
 *     { value: "exterior", label: "Exterior painting" },
 *   ]}
 *   error={errors.service}
 * />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, error, options, placeholder, className = "", id, ...rest },
    ref
  ) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          className={[
            "h-10 w-full rounded-md border px-3 py-2 text-sm text-text-primary",
            "bg-surface",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
            "appearance-none cursor-pointer",
            hasError ? "border-danger focus:ring-danger" : "border-border",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          ].join(" ")}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasError && (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);
