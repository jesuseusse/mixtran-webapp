import { NextRequest, NextResponse } from "next/server";
import * as reviewTokenService from "@/lib/services/reviewTokenService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/** Route segment params for /api/review-tokens/[token]. */
interface Params {
  params: Promise<{ token: string }>;
}

/**
 * Maps a service error message to the appropriate HTTP response.
 * TOKEN_NOT_FOUND → 404
 * TOKEN_USED / TOKEN_EXPIRED → 410 Gone with error code
 */
function tokenErrorResponse(message: string): NextResponse {
  if (message === "TOKEN_NOT_FOUND") {
    return NextResponse.json(
      errorResponse("Enlace no encontrado"),
      { status: 404 }
    );
  }
  if (message === "TOKEN_USED") {
    return NextResponse.json(
      { success: false, error: "Este enlace ya fue utilizado.", code: "TOKEN_USED" },
      { status: 410 }
    );
  }
  if (message === "TOKEN_EXPIRED") {
    return NextResponse.json(
      { success: false, error: "Este enlace ha expirado.", code: "TOKEN_EXPIRED" },
      { status: 410 }
    );
  }
  return NextResponse.json(errorResponse("Error al validar el enlace"), { status: 500 });
}

/**
 * GET /api/review-tokens/[token]
 *
 * Public — validates a review invitation token and returns client metadata.
 * Used by the public /resena/[token] page to confirm the token is valid.
 *
 * Response: { clientName: string; used: boolean; expiresAt: string }
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { token } = await params;

  try {
    const view = await reviewTokenService.getTokenForClient(token);
    return NextResponse.json(successResponse(view));
  } catch (err) {
    return tokenErrorResponse((err as Error).message);
  }
}

/**
 * PATCH /api/review-tokens/[token]
 *
 * Public — marks a token as used after the review has been submitted.
 * The token UUID itself serves as the credential (unforgeable unless leaked).
 *
 * Response: { consumed: true }
 */
export async function PATCH(_request: NextRequest, { params }: Params) {
  const { token } = await params;

  try {
    await reviewTokenService.consumeToken(token);
    return NextResponse.json(successResponse({ consumed: true }));
  } catch (err) {
    return tokenErrorResponse((err as Error).message);
  }
}
