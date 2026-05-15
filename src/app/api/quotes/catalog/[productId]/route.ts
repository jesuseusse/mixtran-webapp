import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as quoteCatalogService from "@/lib/services/quoteCatalogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import type { UpdateCatalogItemInput } from "@/lib/types/QuoteCatalogItem";

/**
 * PATCH /api/quotes/catalog/[productId]
 *
 * Admin only — partially updates a catalog item.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  const { productId } = await params;

  try {
    const body = (await request.json()) as UpdateCatalogItemInput;
    const item = await quoteCatalogService.updateItem(productId, body);

    if (!item) {
      return NextResponse.json(errorResponse("Producto no encontrado"), { status: 404 });
    }

    return NextResponse.json(successResponse(item));
  } catch (err) {
    console.error(`PATCH /api/quotes/catalog/${productId} error:`, err);
    return NextResponse.json(errorResponse("Error al actualizar el producto"), { status: 500 });
  }
}

/**
 * DELETE /api/quotes/catalog/[productId]
 *
 * Admin only — permanently deletes a catalog item.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  const { productId } = await params;

  try {
    await quoteCatalogService.deleteItem(productId);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    console.error(`DELETE /api/quotes/catalog/${productId} error:`, err);
    return NextResponse.json(errorResponse("Error al eliminar el producto"), { status: 500 });
  }
}
