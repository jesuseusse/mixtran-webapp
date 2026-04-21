import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as reviewService from "@/lib/services/reviewService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/**
 * GET /api/reviews
 *
 * Admin only — returns all reviews (pending + approved + rejected).
 */
export async function GET() {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const reviews = await reviewService.getAllReviews();
    return NextResponse.json(successResponse(reviews));
  } catch (err) {
    console.error("GET /api/reviews error:", err);
    return NextResponse.json(errorResponse("Error al obtener las reseñas"), { status: 500 });
  }
}

/**
 * POST /api/reviews
 *
 * Public — submits a new review from the /resenas page.
 * Always starts with status="pending". Admin must approve before it appears on the landing.
 *
 * Body: { authorName: string; email?: string; phone?: string; rating: number; body: string; photoUrl?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      authorName?: string;
      email?: string;
      phone?: string;
      rating?: number;
      body?: string;
      photoUrl?: string;
    };

    if (!body.authorName || !body.rating || !body.body) {
      return NextResponse.json(
        errorResponse("Los campos authorName, rating y body son requeridos"),
        { status: 400 }
      );
    }

    if (typeof body.rating !== "number" || body.rating < 1 || body.rating > 5) {
      return NextResponse.json(
        errorResponse("El campo rating debe ser un número entre 1 y 5"),
        { status: 400 }
      );
    }

    const review = await reviewService.submitReview({
      authorName: body.authorName,
      email: body.email,
      phone: body.phone,
      rating: body.rating,
      body: body.body,
      photoUrl: body.photoUrl,
    });

    return NextResponse.json(successResponse(review), { status: 201 });
  } catch (err) {
    console.error("POST /api/reviews error:", err);
    return NextResponse.json(errorResponse("Error al enviar la reseña"), { status: 500 });
  }
}
