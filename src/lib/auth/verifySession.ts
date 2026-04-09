import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { CognitoJwtVerifierSingleUserPool } from "aws-jwt-verify/cognito-verifier";
import { cookies } from "next/headers";

/**
 * Lazily-created singleton verifier.
 * Initialized on first call so the build step (where env vars are absent)
 * does not crash when importing this module.
 */
let _verifier: CognitoJwtVerifierSingleUserPool<{
  userPoolId: string;
  tokenUse: "id";
  clientId: string;
}> | null = null;

function getVerifier() {
  if (!_verifier) {
    _verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.NEXT_COGNITO_USER_POOL_ID!,
      tokenUse: "id",
      clientId: process.env.NEXT_COGNITO_CLIENT_ID!,
    });
  }
  return _verifier;
}

/**
 * Reads the session cookie and verifies the Cognito JWT.
 * Returns the decoded payload on success, or null if the token is missing or invalid.
 *
 * Must be called from Server Components or API Route Handlers (not Client Components).
 */
export async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.NEXT_SESSION_COOKIE_NAME!)?.value;
  if (!token) return null;
  try {
    return await getVerifier().verify(token);
  } catch {
    return null;
  }
}
