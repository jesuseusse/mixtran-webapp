import { NextResponse } from "next/server";
import * as landingService from "@/lib/services/landingService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/**
 * GET /api/landing
 *
 * Public — returns all landing sections merged with their hardcoded defaults.
 * Used by the admin editor to populate initial form values.
 */
export async function GET() {
  try {
    const sections = await landingService.getAllSectionsForAdmin();
    return NextResponse.json(successResponse(sections));
  } catch (err) {
    console.error("GET /api/landing error:", err);
    return NextResponse.json(errorResponse("Error al obtener las secciones"), { status: 500 });
  }
}
