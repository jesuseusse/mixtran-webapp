"use client";

import { forwardRef, InputHTMLAttributes, useId, useState } from "react";

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

/** Eye icon — password visible state. */
function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Eye-off icon — password hidden state. */
function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/**
 * Accessible text input with optional label, error, and helper text.
 * When `type="password"`, renders a toggle button to show/hide the value.
 * Forwards the ref to the underlying `<input>` element.
 *
 * @example
 * <Input
 *   label="Contraseña"
 *   type="password"
 *   error={errors.password}
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, className = "", id, type, ...rest },
  ref
) {
  /* useId() generates a stable ID that matches between server and client renders,
     avoiding hydration mismatches caused by locale-dependent string transforms. */
  const generated = useId();
  const inputId = id ?? generated;
  const hasError = Boolean(error);
  const isPassword = type === "password";

  /* Local visibility toggle — only meaningful when type="password". */
  const [showPassword, setShowPassword] = useState(false);
  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

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
      {/* Wrapper provides relative positioning for the toggle button. */}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
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
            isPassword ? "pr-10" : "",
            className,
          ].join(" ")}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-primary focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
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
