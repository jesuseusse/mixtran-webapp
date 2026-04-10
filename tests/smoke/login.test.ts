import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Mock the Cognito SDK before the login route is imported.
 * The route creates a cognitoClient singleton at module load time,
 * so the mock must be in place before the module is resolved.
 * Uses a class (not an arrow function) so `new CognitoIdentityProviderClient()` works.
 */
vi.mock("@aws-sdk/client-cognito-identity-provider", () => {
  class MockCognitoClient {
    send() {
      return Promise.resolve({
        AuthenticationResult: { IdToken: "mock-id-token-xyz" },
      });
    }
  }
  return {
    CognitoIdentityProviderClient: MockCognitoClient,
    InitiateAuthCommand: class {},
  };
});

import { POST } from "@/app/api/auth/login/route";

describe("POST /api/auth/login — happy path", () => {
  it("returns 200 and sets the session cookie for valid credentials", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "admin@mixtran.com", password: "Test1234!" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.ok).toBe(true);
    expect(res.headers.get("set-cookie")).toContain("paint_session");
  });
});
