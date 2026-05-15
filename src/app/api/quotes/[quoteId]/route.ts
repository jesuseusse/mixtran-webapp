import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as quoteService from "@/lib/services/quoteService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import type { UpdateQuoteInput } from "@/lib/types/Quote";

/**
 * GET /api/quotes/[quoteId]
 *
 * Admin only — returns a single quote by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  const { quoteId } = await params;

  try {
    const quote = await quoteService.getQuote(quoteId);
    return NextResponse.json(successResponse(quote));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not found")) {
      return NextResponse.json(errorResponse("Cotización no encontrada"), { status: 404 });
    }
    console.error(`GET /api/quotes/${quoteId} error:`, err);
    return NextResponse.json(errorResponse("Error al obtener la cotización"), { status: 500 });
  }
}

/**
 * PATCH /api/quotes/[quoteId]
 *
 * Admin only — partially updates a quote.
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
    const body = (await request.json()) as UpdateQuoteInput;
    const quote = await quoteService.updateQuote(quoteId, body);
    return NextResponse.json(successResponse(quote));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not found")) {
      return NextResponse.json(errorResponse("Cotización no encontrada"), { status: 404 });
    }
    console.error(`PATCH /api/quotes/${quoteId} error:`, err);
    return NextResponse.json(errorResponse("Error al actualizar la cotización"), { status: 500 });
  }
}

/**
 * DELETE /api/quotes/[quoteId]
 *
 * Admin only — permanently deletes a quote.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  const { quoteId } = await params;

  try {
    await quoteService.deleteQuote(quoteId);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not found")) {
      return NextResponse.json(errorResponse("Cotización no encontrada"), { status: 404 });
    }
    console.error(`DELETE /api/quotes/${quoteId} error:`, err);
    return NextResponse.json(errorResponse("Error al eliminar la cotización"), { status: 500 });
  }
}
