import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as quoteConfigService from "@/lib/services/quoteConfigService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import type { UpdateQuoteConfigInput } from "@/lib/types/QuoteConfig";

/**
 * GET /api/quotes/config
 *
 * Admin only — returns the current quote config, or null if unconfigured.
 */
export async function GET() {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const config = await quoteConfigService.getConfig();
    return NextResponse.json(successResponse(config));
  } catch (err) {
    console.error("GET /api/quotes/config error:", err);
    return NextResponse.json(errorResponse("Error al obtener la configuración"), { status: 500 });
  }
}

/**
 * PATCH /api/quotes/config
 *
 * Admin only — creates or fully replaces the quote config.
 * Body: UpdateQuoteConfigInput
 */
export async function PATCH(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const body = (await request.json()) as UpdateQuoteConfigInput;

    if (!body.businessName || !body.currency || body.ivaPercent == null) {
      return NextResponse.json(
        errorResponse("Los campos businessName, currency e ivaPercent son requeridos"),
        { status: 400 }
      );
    }

    const config = await quoteConfigService.saveConfig(body);
    return NextResponse.json(successResponse(config));
  } catch (err) {
    console.error("PATCH /api/quotes/config error:", err);
    return NextResponse.json(errorResponse("Error al guardar la configuración"), { status: 500 });
  }
}
