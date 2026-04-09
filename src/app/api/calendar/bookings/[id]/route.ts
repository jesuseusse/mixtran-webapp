import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as bookingService from "@/lib/services/bookingService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/** Route params injected by Next.js for /api/calendar/bookings/[id]. */
interface Params {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/calendar/bookings/[id]
 *
 * Admin only — updates the booking status to confirmed or cancelled.
 * Optionally attaches a meeting link when confirming.
 *
 * Body: { status: "confirmed" | "cancelled"; meetLink?: string }
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      status?: "confirmed" | "cancelled";
      meetLink?: string;
    };

    if (!body.status || !["confirmed", "cancelled"].includes(body.status)) {
      return NextResponse.json(
        errorResponse("El campo status debe ser 'confirmed' o 'cancelled'"),
        { status: 400 }
      );
    }

    await bookingService.updateBookingStatus({
      slotId: id,
      status: body.status,
      meetLink: body.meetLink,
    });

    return NextResponse.json(successResponse({ updated: true }));
  } catch (err) {
    console.error("PATCH /api/calendar/bookings/[id] error:", err);
    return NextResponse.json(errorResponse("Error al actualizar la reserva"), { status: 500 });
  }
}
