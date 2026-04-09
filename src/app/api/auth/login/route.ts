import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_AWS_REGION ?? "us-east-1",
});

/**
 * Computes the SECRET_HASH required by Cognito when the App Client has a client secret.
 * Formula: Base64(HMAC-SHA256(clientSecret, username + clientId))
 * If NEXT_COGNITO_CLIENT_SECRET is not set, returns undefined (no secret configured).
 */
function computeSecretHash(username: string): string | undefined {
  const secret = process.env.NEXT_COGNITO_CLIENT_SECRET;
  if (!secret) return undefined;
  return createHmac("sha256", secret)
    .update(username + process.env.NEXT_COGNITO_CLIENT_ID!)
    .digest("base64");
}

/**
 * POST /api/auth/login
 *
 * Authenticates the admin user against Cognito using USER_PASSWORD_AUTH.
 * On success, sets an httpOnly session cookie containing the IdToken.
 *
 * Body: { email: string; password: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return NextResponse.json(errorResponse("Email y contraseña son requeridos"), {
        status: 400,
      });
    }

    const secretHash = computeSecretHash(body.email);

    const result = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.NEXT_COGNITO_CLIENT_ID!,
        AuthParameters: {
          USERNAME: body.email,
          PASSWORD: body.password,
          /* Only included when the App Client has a client secret. */
          ...(secretHash && { SECRET_HASH: secretHash }),
        },
      })
    );

    const idToken = result.AuthenticationResult?.IdToken;
    if (!idToken) {
      return NextResponse.json(errorResponse("Autenticación fallida"), { status: 401 });
    }

    const cookieName = process.env.NEXT_SESSION_COOKIE_NAME ?? "paint_session";
    /* Expire the cookie in 1 hour to match Cognito's default token expiry. */
    const maxAge = 60 * 60;

    const response = NextResponse.json(successResponse({ ok: true }));
    response.cookies.set(cookieName, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (err) {
    const e = err as Error;
    console.error(
      "POST /api/auth/login error — name:", e?.name,
      "message:", e?.message,
      "clientId:", process.env.NEXT_COGNITO_CLIENT_ID ? "SET" : "MISSING",
      "userPoolId:", process.env.NEXT_COGNITO_USER_POOL_ID ? "SET" : "MISSING",
      "secret:", process.env.NEXT_COGNITO_CLIENT_SECRET ? "SET" : "NOT SET",
      "region:", process.env.NEXT_AWS_REGION ?? "MISSING"
    );
    const message =
      e?.name === "NotAuthorizedException"
        ? "Credenciales incorrectas"
        : `Error de autenticación (${e?.name ?? "unknown"})`;
    return NextResponse.json(errorResponse(message, "AUTH_ERROR"), { status: 401 });
  }
}
