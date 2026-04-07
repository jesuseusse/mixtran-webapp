/** Visual variant of the badge. */
export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

/** Size of the badge. */
export type BadgeSize = "sm" | "md";

/** Props accepted by the Badge component. */
export interface BadgeProps {
  /** Text content rendered inside the badge. */
  children: React.ReactNode;
  /** Color variant. @default "default" */
  variant?: BadgeVariant;
  /** Size of the badge. @default "md" */
  size?: BadgeSize;
  /** Additional Tailwind classes. */
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-border      text-text-primary",
  success: "bg-success     text-on-success",
  warning: "bg-warning     text-on-warning",
  danger:  "bg-danger      text-on-danger",
  info:    "bg-info        text-on-info",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

/**
 * Inline status badge. Stateless — all appearance controlled by props.
 *
 * @example
 * <Badge variant="success">Confirmed</Badge>
 * <Badge variant="danger" size="sm">Cancelled</Badge>
 */
export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </span>
  );
}
