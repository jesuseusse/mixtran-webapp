/**
 * Known Latin American E.164 dial codes.
 * Sorted longest-first so prefix matching resolves greedily
 * (e.g. +1809 before +1, +593 before +59).
 */
export const LATAM_DIAL_CODES: readonly string[] = [
  "+1809", // Rep. Dominicana
  "+1787", // Puerto Rico
  "+506",  // Costa Rica
  "+503",  // El Salvador
  "+502",  // Guatemala
  "+505",  // Nicaragua
  "+507",  // Panamá
  "+591",  // Bolivia
  "+593",  // Ecuador
  "+595",  // Paraguay
  "+598",  // Uruguay
  "+54",   // Argentina
  "+55",   // Brasil
  "+56",   // Chile
  "+57",   // Colombia
  "+51",   // Perú
  "+52",   // México
  "+53",   // Cuba
  "+58",   // Venezuela
];

/**
 * Returns true when `phone` starts with one of the known LATAM dial codes
 * AND contains at least one digit after the code.
 *
 * @example
 * hasKnownDialCode("+584121234567") // true
 * hasKnownDialCode("+58")           // false — no local digits
 * hasKnownDialCode("04121234567")   // false — missing code
 */
export function hasKnownDialCode(phone: string): boolean {
  for (const code of LATAM_DIAL_CODES) {
    if (phone.startsWith(code)) {
      /* Require at least one digit after the code. */
      return phone.slice(code.length).replace(/\D/g, "").length > 0;
    }
  }
  return false;
}
