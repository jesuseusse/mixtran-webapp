import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as reviewTokenService from "@/lib/services/reviewTokenService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/**
 * POST /api/review-tokens
 *
 * Admin only — creates a one-time review invitation token for a specific client.
 *
 * Body: { clientName: string }
 * Response: { token: string; url: string }
 */
export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const body = (await request.json()) as { clientName?: string };

    if (!body.clientName?.trim()) {
      return NextResponse.json(
        errorResponse("El campo clientName es requerido"),
        { status: 400 }
      );
    }

    const result = await reviewTokenService.createToken({
      clientName: body.clientName,
    });

    return NextResponse.json(successResponse(result), { status: 201 });
  } catch (err) {
    console.error("POST /api/review-tokens error:", err);
    return NextResponse.json(
      errorResponse("Error al crear el enlace de reseña"),
      { status: 500 }
    );
  }
}
