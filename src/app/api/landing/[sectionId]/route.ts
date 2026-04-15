import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as landingService from "@/lib/services/landingService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import type { SectionId } from "@/lib/types/LandingSection";

/** Route params injected by Next.js for /api/landing/[sectionId]. */
interface Params {
  params: Promise<{ sectionId: string }>;
}

const VALID_SECTION_IDS: SectionId[] = [
  "hero",
  "about",
  "products",
  "gallery",
  "reviews",
  "booking_cta",
  "contact",
];

/**
 * GET /api/landing/[sectionId]
 *
 * Public — returns the content for a single section merged with defaults.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { sectionId } = await params;

    if (!VALID_SECTION_IDS.includes(sectionId as SectionId)) {
      return NextResponse.json(errorResponse("Sección inválida"), { status: 400 });
    }

    const content = await landingService.getSection(sectionId as SectionId);
    return NextResponse.json(successResponse(content));
  } catch (err) {
    console.error("GET /api/landing/[sectionId] error:", err);
    return NextResponse.json(errorResponse("Error al obtener la sección"), { status: 500 });
  }
}

/**
 * PATCH /api/landing/[sectionId]
 *
 * Admin only — updates a section's content and triggers ISR revalidation.
 *
 * Body: { content: Record<string, unknown> }
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const { sectionId } = await params;

    if (!VALID_SECTION_IDS.includes(sectionId as SectionId)) {
      return NextResponse.json(errorResponse("Sección inválida"), { status: 400 });
    }

    const body = (await request.json()) as {
      content?: Record<string, unknown>;
      enabled?: boolean;
      order?: number;
    };

    if (
      body.content === undefined &&
      body.enabled === undefined &&
      body.order === undefined
    ) {
      return NextResponse.json(
        errorResponse("Se requiere al menos uno de: content, enabled, order"),
        { status: 400 }
      );
    }

    await landingService.updateSection({
      sectionId: sectionId as SectionId,
      ...(body.content !== undefined && { content: body.content }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
      ...(body.order !== undefined && { order: body.order }),
    });

    return NextResponse.json(successResponse({ updated: true }));
  } catch (err) {
    console.error("PATCH /api/landing/[sectionId] error:", err);
    return NextResponse.json(errorResponse("Error al actualizar la sección"), { status: 500 });
  }
}
