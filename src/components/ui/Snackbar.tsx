"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

/** Visual type of the snackbar message. */
export type SnackbarType = "success" | "error" | "info" | "warning";

/** Props accepted by the Snackbar component. */
export interface SnackbarProps {
  /** Whether the snackbar is currently visible. */
  visible: boolean;
  /** The message to display. */
  message: string;
  /** Visual style that conveys the message severity. */
  type?: SnackbarType;
  /** Callback fired when the snackbar should be dismissed. */
  onDismiss: () => void;
  /** Auto-dismiss delay in milliseconds. @default 4000 */
  duration?: number;
  /** Additional Tailwind classes applied to the snackbar container. */
  className?: string;
}

const TYPE_CLASSES: Record<SnackbarType, string> = {
  success: "bg-success text-on-success",
  error:   "bg-danger  text-on-danger",
  info:    "bg-info    text-on-info",
  warning: "bg-warning text-on-warning",
};

/**
 * Auto-dismissing notification bar rendered via `createPortal` into `document.body`.
 *
 * Fires `onDismiss` after `duration` milliseconds (default 4 s) or when the
 * user clicks the ✕ button. The parent component controls visibility — set
 * `visible` to `false` from `onDismiss` to hide it.
 *
 * @example
 * <Snackbar
 *   visible={showSnackbar}
 *   message="Booking confirmed!"
 *   type="success"
 *   onDismiss={() => setShowSnackbar(false)}
 * />
 */
export function Snackbar({
  visible,
  message,
  type = "info",
  onDismiss,
  duration = 4000,
  className = "",
}: SnackbarProps) {
  /* Auto-dismiss timer. Reset whenever visible or duration changes. */
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={[
        "fixed bottom-6 left-1/2 z-50 -translate-x-1/2",
        "flex items-center gap-3 rounded-lg px-5 py-3 shadow-modal",
        "text-sm font-medium",
        TYPE_CLASSES[type],
        className,
      ].join(" ")}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-1 opacity-80 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current rounded"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>,
    document.body
  );
}
