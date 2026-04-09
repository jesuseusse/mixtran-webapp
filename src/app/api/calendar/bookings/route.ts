import { NextRequest, NextResponse } from "next/server";
import * as bookingService from "@/lib/services/bookingService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/**
 * POST /api/calendar/bookings
 *
 * Public — creates a booking from the /agendar page.
 * Validates slot availability, writes the booking, upserts the contact,
 * and sends confirmation emails.
 *
 * Body: { slotId: string; name: string; email: string; phone: string; message?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      slotId?: string;
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };

    if (!body.slotId || !body.name || !body.email || !body.phone) {
      return NextResponse.json(
        errorResponse("Los campos slotId, name, email y phone son requeridos"),
        { status: 400 }
      );
    }

    /* Basic email format validation. */
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(errorResponse("Email inválido"), { status: 400 });
    }

    await bookingService.createBooking({
      slotId: body.slotId,
      name: body.name,
      email: body.email,
      phone: body.phone,
      message: body.message,
    });

    return NextResponse.json(successResponse({ booked: true }), { status: 201 });
  } catch (err) {
    console.error("POST /api/calendar/bookings error:", err);
    const message = err instanceof Error ? err.message : "";
    const isUnavailable = message.includes("no longer available");
    return NextResponse.json(
      errorResponse(
        isUnavailable
          ? "El horario seleccionado ya no está disponible"
          : "Error al procesar la reserva"
      ),
      { status: isUnavailable ? 409 : 500 }
    );
  }
}
