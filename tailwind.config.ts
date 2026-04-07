import type { Config } from "tailwindcss";

/**
 * Tailwind configuration.
 *
 * All color utilities are mapped to CSS custom properties defined in
 * src/app/globals.css. To retheme the entire app, change ONLY the hex
 * values in the :root block of globals.css — never touch component files.
 *
 * Usage examples:
 *   className="bg-primary text-on-primary"
 *   className="bg-accent text-on-accent"
 *   className="bg-danger text-on-danger border-border"
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* ── Brand palette ──────────────────────────────────────────── */
        primary:          "var(--color-primary)",
        "primary-dark":   "var(--color-primary-dark)",
        secondary:        "var(--color-secondary)",
        accent:           "var(--color-accent)",
        surface:          "var(--color-surface)",
        background:       "var(--color-background)",
        border:           "var(--color-border)",

        /* ── Text ───────────────────────────────────────────────────── */
        "text-primary":   "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-muted":     "var(--color-text-muted)",
        "on-primary":     "var(--color-on-primary)",
        "on-accent":      "var(--color-on-accent)",

        /* ── Semantic states ────────────────────────────────────────── */
        success:          "var(--color-success)",
        warning:          "var(--color-warning)",
        danger:           "var(--color-danger)",
        info:             "var(--color-info)",
        "on-success":     "var(--color-on-success)",
        "on-warning":     "var(--color-on-warning)",
        "on-danger":      "var(--color-on-danger)",
        "on-info":        "var(--color-on-info)",
      },

      fontFamily: {
        sans:    ["var(--font-sans)"],
        heading: ["var(--font-heading)"],
      },

      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },

      boxShadow: {
        card:   "var(--shadow-card)",
        modal:  "var(--shadow-modal)",
        button: "var(--shadow-button)",
      },
    },
  },
  plugins: [],
};

export default config;
