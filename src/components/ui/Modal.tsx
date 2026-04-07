"use client";

import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

/** Props accepted by the Modal component. */
export interface ModalProps {
  /** Title rendered in the modal header. */
  title: string;
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** Callback fired when the user dismisses the modal (backdrop click or Escape key). */
  onClose: () => void;
  /** Content rendered inside the modal body. */
  children: ReactNode;
  /** Additional Tailwind classes applied to the modal panel. */
  className?: string;
}

/**
 * Accessible modal dialog rendered via `createPortal` into `document.body`.
 *
 * - Traps focus within the modal while open.
 * - Closes on Escape key or backdrop click.
 * - Prevents body scroll while open.
 *
 * @example
 * <Modal title="Confirm booking" isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <p>Are you sure you want to book this slot?</p>
 * </Modal>
 */
export function Modal({ title, isOpen, onClose, children, className = "" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  /* Close on Escape and restore body scroll on unmount. */
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={[
          "relative z-10 w-full max-w-md mx-4 rounded-lg bg-surface p-6 shadow-modal",
          className,
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-text-primary"
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-text-muted hover:text-text-primary transition-colors p-1 -mr-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {/* Simple × glyph — no external icon library */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}
