"use client";

import { forwardRef, InputHTMLAttributes } from "react";

/** Props accepted by the Input component. */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible label rendered above the input. */
  label?: string;
  /** Error message rendered below the input in danger color. */
  error?: string;
  /** Hint text rendered below the input in muted color. */
  helperText?: string;
  /** Additional Tailwind classes applied to the `<input>` element. */
  className?: string;
}

/**
 * Accessible text input with optional label, error, and helper text.
 * Forwards the ref to the underlying `<input>` element.
 *
 * @example
 * <Input
 *   label="Email address"
 *   type="email"
 *   placeholder="you@example.com"
 *   error={errors.email}
 *   helperText="We'll never share your email."
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, className = "", id, ...rest },
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
      <input
        ref={ref}
        id={inputId}
        aria-invalid={hasError}
        aria-describedby={
          hasError
            ? `${inputId}-error`
            : helperText
            ? `${inputId}-helper`
            : undefined
        }
        className={[
          "h-10 w-full rounded-md border px-3 py-2 text-sm text-text-primary",
          "bg-surface placeholder:text-text-muted",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
          hasError
            ? "border-danger focus:ring-danger"
            : "border-border",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        ].join(" ")}
        {...rest}
      />
      {hasError && (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
      {!hasError && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
});
