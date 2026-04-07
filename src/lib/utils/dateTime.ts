/**
 * Date and time formatting utilities used across the application.
 * All functions accept ISO 8601 strings and return locale-formatted strings.
 */

/**
 * Formats an ISO 8601 date string into a human-readable date.
 *
 * @param iso - An ISO 8601 date/datetime string (e.g. `"2025-06-15"` or `"2025-06-15T10:00:00Z"`).
 * @returns A formatted date string using the user's locale (e.g. `"June 15, 2025"`).
 *
 * @example
 * formatDate("2025-06-15") // → "June 15, 2025"
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats an ISO 8601 datetime string into a human-readable time.
 *
 * @param iso - An ISO 8601 datetime string (e.g. `"2025-06-15T14:30:00Z"`).
 * @returns A formatted time string using the user's locale (e.g. `"2:30 PM"`).
 *
 * @example
 * formatTime("2025-06-15T14:30:00Z") // → "2:30 PM"
 */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
