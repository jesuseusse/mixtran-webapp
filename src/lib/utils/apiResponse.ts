/**
 * Typed helpers for building consistent API route responses.
 *
 * Every API route in this project must return one of these two shapes:
 *   - Success: { success: true; data: T }
 *   - Error:   { success: false; error: string; code?: string }
 */

/** The shape of a successful API response. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/** The shape of an error API response. */
export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

/** Union type covering both response variants. */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * Builds a typed success response payload.
 *
 * @param data - The value to include in the `data` field.
 * @returns An object with `success: true` and the provided data.
 *
 * @example
 * return NextResponse.json(successResponse(slots), { status: 200 });
 */
export function successResponse<T>(data: T): ApiSuccess<T> {
  return { success: true, data };
}

/**
 * Builds a typed error response payload.
 *
 * @param error - Human-readable description of what went wrong.
 * @param code  - Optional machine-readable error code (e.g. `'SLOT_UNAVAILABLE'`).
 * @returns An object with `success: false`, the error message, and optional code.
 *
 * @example
 * return NextResponse.json(errorResponse('Slot not found', 'SLOT_NOT_FOUND'), { status: 404 });
 */
export function errorResponse(error: string, code?: string): ApiError {
  return code !== undefined
    ? { success: false, error, code }
    : { success: false, error };
}
