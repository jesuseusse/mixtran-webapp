import { NextResponse } from "next/server";
import { successResponse } from "@/lib/utils/apiResponse";

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie. No Cognito call is needed because
 * the token expires on its own; simply removing the cookie is sufficient.
 */
export async function POST() {
  const cookieName = process.env.NEXT_SESSION_COOKIE_NAME ?? "paint_session";
  const response = NextResponse.json(successResponse({ ok: true }));
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
