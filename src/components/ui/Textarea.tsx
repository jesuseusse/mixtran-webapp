"use client";

import { forwardRef, TextareaHTMLAttributes, useId } from "react";

/** Props accepted by the Textarea component. */
export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visible label rendered above the textarea. */
  label?: string;
  /** Error message rendered below the textarea in danger color. */
  error?: string;
  /** Hint text rendered below the textarea in muted color. */
  helperText?: string;
  /** Additional Tailwind classes applied to the `<textarea>` element. */
  className?: string;
}

/**
 * Accessible multi-line text input with optional label, error, and helper text.
 * Forwards the ref to the underlying `<textarea>` element.
 *
 * @example
 * <Textarea
 *   label="Message"
 *   rows={4}
 *   placeholder="Describe your project..."
 *   error={errors.message}
 * />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, helperText, className = "", id, ...rest }, ref) {
    const generated = useId();
    const inputId = id ?? generated;
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
        <textarea
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
            "w-full rounded-md border px-3 py-2 text-sm text-text-primary",
            "bg-surface placeholder:text-text-muted",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
            "resize-y min-h-[80px]",
            hasError ? "border-danger focus:ring-danger" : "border-border",
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
  }
);
