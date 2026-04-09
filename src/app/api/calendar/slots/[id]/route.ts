import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as bookingService from "@/lib/services/bookingService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/** Route params injected by Next.js for /api/calendar/slots/[id]. */
interface Params {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/calendar/slots/[id]
 *
 * Admin only — deletes an unbooked slot.
 * Returns 409 if the slot has an active booking.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const { id } = await params;
    await bookingService.deleteSlot(id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    console.error("DELETE /api/calendar/slots/[id] error:", err);
    const message = err instanceof Error ? err.message : "Error al eliminar el horario";
    const isConflict = message.includes("booked slot");
    return NextResponse.json(errorResponse(message), {
      status: isConflict ? 409 : 500,
    });
  }
}
