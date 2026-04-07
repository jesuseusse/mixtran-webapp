"use client";

import { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

/** Visual style variant of the button. */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/** Size of the button. */
export type ButtonSize = "sm" | "md" | "lg";

/** Props accepted by the Button component. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant. @default "primary" */
  variant?: ButtonVariant;
  /** Size of the button. @default "md" */
  size?: ButtonSize;
  /** When true, shows a spinner and disables interaction. */
  loading?: boolean;
  /** Additional Tailwind classes. */
  className?: string;
}

/** Base classes shared by all variants. */
const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-dark focus-visible:ring-primary shadow-button",
  secondary:
    "bg-surface text-text-primary border border-border hover:bg-background focus-visible:ring-primary",
  ghost:
    "bg-transparent text-text-primary hover:bg-background focus-visible:ring-primary",
  danger:
    "bg-danger text-on-danger hover:opacity-90 focus-visible:ring-danger shadow-button",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-10 px-5 text-sm rounded-md",
  lg: "h-12 px-7 text-base rounded-lg",
};

/**
 * General-purpose button with variant and size support.
 *
 * All colors resolve through CSS variables — no raw color utilities.
 * Pass `loading` to show an inline spinner and disable interaction.
 *
 * @example
 * <Button variant="primary" size="md" onClick={handleSubmit}>
 *   Book appointment
 * </Button>
 *
 * <Button variant="danger" loading={isDeleting}>
 *   Delete
 * </Button>
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`${BASE} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <Spinner
          size="sm"
          className={variant === "ghost" || variant === "secondary" ? "text-text-primary" : "text-on-primary"}
        />
      )}
      {children}
    </button>
  );
}
