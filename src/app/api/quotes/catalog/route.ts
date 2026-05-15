import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as quoteCatalogService from "@/lib/services/quoteCatalogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import type { CreateCatalogItemInput } from "@/lib/types/QuoteCatalogItem";

/**
 * GET /api/quotes/catalog
 *
 * Admin only — returns all catalog items sorted by usageCount desc.
 */
export async function GET() {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const items = await quoteCatalogService.getAllItems();
    return NextResponse.json(successResponse(items));
  } catch (err) {
    console.error("GET /api/quotes/catalog error:", err);
    return NextResponse.json(errorResponse("Error al obtener el catálogo"), { status: 500 });
  }
}

/**
 * POST /api/quotes/catalog
 *
 * Admin only — creates a new catalog item.
 * Body: { name, unit, unitPrice, description?, category? }
 */
export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateCatalogItemInput;

    if (!body.name || !body.unit || body.unitPrice == null) {
      return NextResponse.json(
        errorResponse("Los campos name, unit y unitPrice son requeridos"),
        { status: 400 }
      );
    }

    const item = await quoteCatalogService.addItem(body);
    return NextResponse.json(successResponse(item), { status: 201 });
  } catch (err) {
    console.error("POST /api/quotes/catalog error:", err);
    return NextResponse.json(errorResponse("Error al crear el producto"), { status: 500 });
  }
}
