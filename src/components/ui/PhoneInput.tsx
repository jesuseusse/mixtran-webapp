"use client";

import { forwardRef, useId } from "react";

/** A Latin American dial code entry. */
interface DialEntry {
  /** E.164 country dial code including the leading +. */
  code: string;
  /** Emoji flag. */
  flag: string;
  /** Country name in Spanish. */
  name: string;
}

/** Latin American countries ordered alphabetically by name. */
const LATAM_CODES: DialEntry[] = [
  { code: "+54",   flag: "🇦🇷", name: "Argentina" },
  { code: "+591",  flag: "🇧🇴", name: "Bolivia" },
  { code: "+55",   flag: "🇧🇷", name: "Brasil" },
  { code: "+56",   flag: "🇨🇱", name: "Chile" },
  { code: "+57",   flag: "🇨🇴", name: "Colombia" },
  { code: "+506",  flag: "🇨🇷", name: "Costa Rica" },
  { code: "+53",   flag: "🇨🇺", name: "Cuba" },
  { code: "+1809", flag: "🇩🇴", name: "Rep. Dominicana" },
  { code: "+593",  flag: "🇪🇨", name: "Ecuador" },
  { code: "+503",  flag: "🇸🇻", name: "El Salvador" },
  { code: "+502",  flag: "🇬🇹", name: "Guatemala" },
  { code: "+504",  flag: "🇭🇳", name: "Honduras" },
  { code: "+52",   flag: "🇲🇽", name: "México" },
  { code: "+505",  flag: "🇳🇮", name: "Nicaragua" },
  { code: "+507",  flag: "🇵🇦", name: "Panamá" },
  { code: "+595",  flag: "🇵🇾", name: "Paraguay" },
  { code: "+51",   flag: "🇵🇪", name: "Perú" },
  { code: "+1787", flag: "🇵🇷", name: "Puerto Rico" },
  { code: "+598",  flag: "🇺🇾", name: "Uruguay" },
  { code: "+58",   flag: "🇻🇪", name: "Venezuela" },
];

/**
 * Sorted longest-first so "+593" is matched before "+59",
 * and "+1809" before "+1".
 */
const SORTED_FOR_MATCH = [...LATAM_CODES].sort(
  (a, b) => b.code.length - a.code.length
);

/**
 * Derives the active dial code from the current phone value.
 * Falls back to Venezuela (+58) when no known code is found.
 */
function deriveDialCode(value: string): string {
  for (const { code } of SORTED_FOR_MATCH) {
    if (value.startsWith(code)) return code;
  }
  return "+58";
}

/** Props accepted by PhoneInput. */
export interface PhoneInputProps {
  /** Visible label rendered above the input. */
  label?: string;
  /** Error message rendered below the input in danger color. */
  error?: string;
  /** Hint text rendered below the input in muted color. */
  helperText?: string;
  /**
   * Controlled value — the full international phone number
   * including the dial code (e.g. "+584121234567").
   */
  value: string;
  /** Called with the updated full phone string on every change. */
  onChange: (value: string) => void;
  /** Additional Tailwind classes applied to the `<input>` element. */
  className?: string;
  disabled?: boolean;
  required?: boolean;
  /** HTML id for the input — auto-generated when omitted. */
  id?: string;
}

/**
 * Phone number input with Latin American country dial code selector.
 *
 * - Venezuela (+58) is selected by default.
 * - Selecting a country replaces the prefix in the current value.
 * - Typing "+XX…" directly in the input auto-selects the matching country.
 * - The ref is forwarded to the underlying `<input type="tel">` element.
 *
 * @example
 * <PhoneInput
 *   label="Teléfono"
 *   value={phone}
 *   onChange={setPhone}
 *   required
 * />
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  function PhoneInput(
    { label, error, helperText, value, onChange, className = "", disabled, required, id },
    ref
  ) {
    const generated = useId();
    const inputId = id ?? generated;
    const hasError = Boolean(error);

    /* Derive the active dial code purely from the current value — no extra state. */
    const activeCode = deriveDialCode(value);
    const activeEntry = LATAM_CODES.find((c) => c.code === activeCode)!;

    /** Replaces the current prefix with the newly selected dial code. */
    function handleDialChange(newCode: string) {
      /* Strip the old prefix (if present) to get the local digits. */
      const localPart = value.startsWith(activeCode)
        ? value.slice(activeCode.length)
        : value.replace(/^\+\d*/, "");
      onChange(newCode + localPart);
    }

    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
      /* Pass through — selectedCode re-derives automatically on next render. */
      onChange(e.target.value);
    }

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}

        {/*
          Outer wrapper acts as the visual "input box".
          focus-within applies the focus ring when either child is focused.
        */}
        <div
          className={[
            "flex h-10 w-full overflow-hidden rounded-md border bg-surface transition-colors",
            "focus-within:ring-2 focus-within:ring-offset-0",
            hasError
              ? "border-danger focus-within:ring-danger"
              : "border-border focus-within:ring-primary",
            disabled ? "cursor-not-allowed opacity-50" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* ── Dial code selector ─────────────────────────────────────────── */}
          {/*
            Pattern: a visible badge overlaid by a transparent native <select>.
            The native select handles accessibility and the OS dropdown — the
            badge provides the custom visual with flag + code.
          */}
          <div className="relative flex shrink-0 items-center border-r border-border bg-background">
            {/* Visual badge — pointer-events-none so clicks pass to the select */}
            <span
              className="pointer-events-none flex select-none items-center gap-1 px-3 text-sm text-text-primary"
              aria-hidden="true"
            >
              {activeEntry.flag}
              <span className="font-medium">{activeCode}</span>
              {/* Chevron */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>

            {/* Invisible native select — covers the badge, handles interaction */}
            <select
              value={activeCode}
              onChange={(e) => handleDialChange(e.target.value)}
              disabled={disabled}
              aria-label="Código de país"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              {LATAM_CODES.map((entry) => (
                <option key={entry.code} value={entry.code}>
                  {entry.flag} {entry.name} ({entry.code})
                </option>
              ))}
            </select>
          </div>

          {/* ── Phone number input ─────────────────────────────────────────── */}
          <input
            ref={ref}
            id={inputId}
            type="tel"
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            required={required}
            autoComplete="tel"
            placeholder={`${activeCode}4120000000`}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={[
              "h-full min-w-0 flex-1 bg-surface px-3 text-sm text-text-primary",
              "placeholder:text-text-muted focus:outline-none",
              "disabled:cursor-not-allowed",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
          />
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
  }
);
