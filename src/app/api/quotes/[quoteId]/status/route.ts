import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as quoteService from "@/lib/services/quoteService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import type { QuoteStatus } from "@/lib/types/Quote";

const VALID_STATUSES: QuoteStatus[] = ["draft", "sent", "accepted", "rejected", "expired"];

/**
 * PATCH /api/quotes/[quoteId]/status
 *
 * Admin only — transitions a quote to a new status.
 * Body: { status: QuoteStatus }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  const { quoteId } = await params;

  try {
    const body = (await request.json()) as { status?: QuoteStatus };

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        errorResponse(`El estado debe ser uno de: ${VALID_STATUSES.join(", ")}`),
        { status: 400 }
      );
    }

    const quote = await quoteService.updateStatus(quoteId, body.status);
    return NextResponse.json(successResponse(quote));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not found")) {
      return NextResponse.json(errorResponse("Cotización no encontrada"), { status: 404 });
    }
    console.error(`PATCH /api/quotes/${quoteId}/status error:`, err);
    return NextResponse.json(errorResponse("Error al cambiar el estado"), { status: 500 });
  }
}
