"use client";

import { useEffect, useRef, useState, ReactNode, CSSProperties } from "react";

/** Animation direction variant. */
export type RevealVariant = "up" | "left" | "right";

/** Props accepted by AnimateInView. */
export interface AnimateInViewProps {
  /** Content to reveal on scroll. */
  children: ReactNode;
  /**
   * Direction the element slides in from.
   * @default "up"
   */
  variant?: RevealVariant;
  /**
   * Delay before the transition starts, in milliseconds.
   * Useful for staggering sibling elements.
   * @default 0
   */
  delay?: number;
  /** Additional Tailwind classes applied to the wrapper div. */
  className?: string;
}

/** Initial transform offsets per variant. */
const INITIAL_TRANSFORM: Record<RevealVariant, string> = {
  up:    "translateY(28px)",
  left:  "translateX(-28px)",
  right: "translateX(28px)",
};

/**
 * Wraps children in a div that fades and slides into view when scrolled
 * into the viewport. Uses `IntersectionObserver` + React state — zero
 * external dependencies.
 *
 * Visibility is tracked via `useState` so the style update is managed by
 * React's reconciler, which prevents the state from being lost on re-renders.
 * Inline styles are used to avoid any CSS-layer conflicts with Tailwind v4.
 *
 * `prefers-reduced-motion: reduce` is respected — elements become immediately
 * visible without any transition.
 *
 * @example
 * <AnimateInView variant="up" delay={150}>
 *   <h2>Heading</h2>
 * </AnimateInView>
 */
export function AnimateInView({
  children,
  variant = "up",
  delay = 0,
  className = "",
}: AnimateInViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* Skip animation entirely for users who prefer reduced motion. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? "translate(0, 0)" : INITIAL_TRANSFORM[variant],
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
    /* Ensure the wrapper never collapses layout while invisible. */
    willChange: visible ? "auto" : "opacity, transform",
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
