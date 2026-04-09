import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as bookingService from "@/lib/services/bookingService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/**
 * POST /api/calendar/slots/bulk
 *
 * Admin only — creates multiple slots in a single request.
 * Useful for generating a full week's worth of slots at once.
 *
 * Body: { slots: Array<{ date: string; startTime: string; endTime: string }> }
 */
export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      slots?: Array<{ date: string; startTime: string; endTime: string }>;
    };

    if (!Array.isArray(body.slots) || body.slots.length === 0) {
      return NextResponse.json(
        errorResponse("El campo slots debe ser un arreglo no vacío"),
        { status: 400 }
      );
    }

    /* Validate each slot has the required fields. */
    const invalid = body.slots.some((s) => !s.date || !s.startTime || !s.endTime);
    if (invalid) {
      return NextResponse.json(
        errorResponse("Cada slot debe tener date, startTime y endTime"),
        { status: 400 }
      );
    }

    const created = await bookingService.createSlotsBulk(body.slots);
    return NextResponse.json(successResponse(created), { status: 201 });
  } catch (err) {
    console.error("POST /api/calendar/slots/bulk error:", err);
    return NextResponse.json(errorResponse("Error al crear los horarios"), { status: 500 });
  }
}
