import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as quoteService from "@/lib/services/quoteService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import type { CreateQuoteInput, QuoteListFilters, QuoteStatus } from "@/lib/types/Quote";

/**
 * GET /api/quotes
 *
 * Admin only — returns quotes. Accepts ?status=&search=&from=&to= query params.
 */
export async function GET(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filters: QuoteListFilters = {};

    const status = searchParams.get("status") as QuoteStatus | null;
    if (status) filters.status = status;

    const search = searchParams.get("search");
    if (search) filters.search = search;

    const from = searchParams.get("from");
    if (from) filters.from = from;

    const to = searchParams.get("to");
    if (to) filters.to = to;

    const quotes = await quoteService.getQuotes(filters);
    return NextResponse.json(successResponse(quotes));
  } catch (err) {
    console.error("GET /api/quotes error:", err);
    return NextResponse.json(errorResponse("Error al obtener las cotizaciones"), { status: 500 });
  }
}

/**
 * POST /api/quotes
 *
 * Admin only — creates a new quote.
 * Returns 422 with code QUOTE_CONFIG_MISSING if business config is not set up.
 */
export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateQuoteInput;

    if (!body.clientName || !body.items || body.items.length === 0) {
      return NextResponse.json(
        errorResponse("Los campos clientName e items son requeridos"),
        { status: 400 }
      );
    }

    const quote = await quoteService.createQuote(body);
    return NextResponse.json(successResponse(quote), { status: 201 });
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "QUOTE_CONFIG_MISSING") {
      return NextResponse.json(
        errorResponse(
          "Configura los datos del negocio antes de crear cotizaciones.",
          "QUOTE_CONFIG_MISSING"
        ),
        { status: 422 }
      );
    }
    console.error("POST /api/quotes error:", err);
    return NextResponse.json(errorResponse("Error al crear la cotización"), { status: 500 });
  }
}
