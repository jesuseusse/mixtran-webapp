import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/verifySession";
import * as contactService from "@/lib/services/contactService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

/**
 * GET /api/contacts
 *
 * Admin only — returns all contacts sorted by name.
 */
export async function GET() {
  const user = await verifySession();
  if (!user) {
    return NextResponse.json(errorResponse("No autorizado"), { status: 401 });
  }

  try {
    const contacts = await contactService.getAllContacts();
    return NextResponse.json(successResponse(contacts));
  } catch (err) {
    console.error("GET /api/contacts error:", err);
    return NextResponse.json(errorResponse("Error al obtener los contactos"), { status: 500 });
  }
}

/**
 * POST /api/contacts
 *
 * Public — upserts a contact from the landing page contact form.
 * Creates the record if it does not exist; updates phone/name if it does.
 *
 * Body: { name: string; email: string; phone: string; message?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };

    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json(
        errorResponse("Los campos nombre, email y teléfono son requeridos"),
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(errorResponse("Email inválido"), { status: 400 });
    }

    await contactService.upsertFromLanding({
      name: body.name,
      email: body.email,
      phone: body.phone,
    });

    return NextResponse.json(successResponse({ saved: true }), { status: 201 });
  } catch (err) {
    console.error("POST /api/contacts error:", err);
    return NextResponse.json(errorResponse("Error al guardar el contacto"), { status: 500 });
  }
}
