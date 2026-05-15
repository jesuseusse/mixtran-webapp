import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as quotePdfService from "@/lib/services/quotePdfService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/**
 * POST /api/quotes/[quoteId]/pdf
 *
 * Admin only — generates a PDF, uploads it to S3, and returns the download URL.
 * Response: { url: string } — CloudFront or pre-signed S3 URL valid for 10 minutes.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  const { quoteId } = await params;

  try {
    const url = await quotePdfService.generateAndUpload(quoteId);
    return NextResponse.json(successResponse({ url }));
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "QUOTE_CONFIG_MISSING") {
      return NextResponse.json(
        errorResponse("Configura los datos del negocio antes de generar un PDF.", "QUOTE_CONFIG_MISSING"),
        { status: 422 }
      );
    }
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("not found")) {
      return NextResponse.json(errorResponse("Cotización no encontrada"), { status: 404 });
    }
    console.error(`POST /api/quotes/${quoteId}/pdf error:`, err);
    return NextResponse.json(errorResponse("Error al generar el PDF"), { status: 500 });
  }
}
