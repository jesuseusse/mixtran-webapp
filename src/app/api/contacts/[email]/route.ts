import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as contactService from "@/lib/services/contactService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/** Route params injected by Next.js for /api/contacts/[email]. */
interface Params {
  params: Promise<{ email: string }>;
}

/**
 * GET /api/contacts/[email]
 *
 * Admin only — returns a single contact by email.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const { email } = await params;
    const contact = await contactService.getContact(decodeURIComponent(email));
    return NextResponse.json(successResponse(contact));
  } catch (err) {
    console.error("GET /api/contacts/[email] error:", err);
    const notFound = (err as Error)?.message?.includes("not found");
    return NextResponse.json(
      errorResponse(notFound ? "Contacto no encontrado" : "Error al obtener el contacto"),
      { status: notFound ? 404 : 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[email]
 *
 * Admin only — updates tags, notes, or company for a contact.
 * Body: { tags?: string[]; notes?: string; company?: string }
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const { email } = await params;
    const body = (await request.json()) as {
      tags?: string[];
      notes?: string;
      company?: string;
    };

    await contactService.patchContact(decodeURIComponent(email), body);
    return NextResponse.json(successResponse({ updated: true }));
  } catch (err) {
    console.error("PATCH /api/contacts/[email] error:", err);
    return NextResponse.json(errorResponse("Error al actualizar el contacto"), { status: 500 });
  }
}
