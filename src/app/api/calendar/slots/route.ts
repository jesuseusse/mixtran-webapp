import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as bookingService from "@/lib/services/bookingService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/**
 * GET /api/calendar/slots?date=YYYY-MM-DD
 *
 * Public — returns available slots for the given date.
 * Used by the public booking page /agendar.
 */
export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(errorResponse("Parámetro date inválido (YYYY-MM-DD)"), {
        status: 400,
      });
    }
    const slots = await bookingService.getAvailableSlots(date);
    return NextResponse.json(successResponse(slots));
  } catch (err) {
    console.error("GET /api/calendar/slots error:", err);
    return NextResponse.json(errorResponse("Error al obtener los horarios"), { status: 500 });
  }
}

/**
 * POST /api/calendar/slots
 *
 * Admin only — creates a single slot.
 * Body: { date: string; startTime: string; endTime: string }
 */
export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      date?: string;
      startTime?: string;
      endTime?: string;
    };

    if (!body.date || !body.startTime || !body.endTime) {
      return NextResponse.json(
        errorResponse("Los campos date, startTime y endTime son requeridos"),
        { status: 400 }
      );
    }

    const slot = await bookingService.createSlot({
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
    });

    return NextResponse.json(successResponse(slot), { status: 201 });
  } catch (err) {
    const e = err as Error;
    console.error("POST /api/calendar/slots error — name:", e?.name, "message:", e?.message);
    return NextResponse.json(
      errorResponse(`Error al crear el horario: ${e?.name} — ${e?.message}`),
      { status: 500 }
    );
  }
}
