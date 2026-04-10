import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as reviewService from "@/lib/services/reviewService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/** Route params injected by Next.js for /api/reviews/[id]. */
interface Params {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/reviews/[id]
 *
 * Admin only — approves or rejects a review.
 * Approval triggers revalidatePath('/') so the landing reflects the change immediately.
 *
 * Body: { status: "approved" | "rejected" }
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { status?: "approved" | "rejected" };

    if (!body.status || !["approved", "rejected"].includes(body.status)) {
      return NextResponse.json(
        errorResponse("El campo status debe ser 'approved' o 'rejected'"),
        { status: 400 }
      );
    }

    if (body.status === "approved") {
      await reviewService.approveReview(id);
    } else {
      await reviewService.rejectReview(id);
    }

    return NextResponse.json(successResponse({ updated: true }));
  } catch (err) {
    console.error("PATCH /api/reviews/[id] error:", err);
    const notFound = (err as Error)?.message?.includes("not found");
    return NextResponse.json(
      errorResponse(notFound ? "Reseña no encontrada" : "Error al moderar la reseña"),
      { status: notFound ? 404 : 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[id]
 *
 * Admin only — permanently deletes a review.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const { id } = await params;
    await reviewService.deleteReview(id);
    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    console.error("DELETE /api/reviews/[id] error:", err);
    const notFound = (err as Error)?.message?.includes("not found");
    return NextResponse.json(
      errorResponse(notFound ? "Reseña no encontrada" : "Error al eliminar la reseña"),
      { status: notFound ? 404 : 500 }
    );
  }
}
