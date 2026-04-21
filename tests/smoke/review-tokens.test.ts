import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/verifySession", () => ({
  verifySession: vi.fn().mockResolvedValue({ email: "admin@mixtran.com" }),
}));

vi.mock("@/lib/services/reviewTokenService", () => ({
  createToken: vi.fn().mockResolvedValue({
    token: "mock-uuid-token-abc",
    url: "https://mixtranrevestimientos.com/resena/mock-uuid-token-abc",
  }),
  getTokenForClient: vi.fn().mockResolvedValue({
    clientName: "María García",
    used: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }),
  consumeToken: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/review-tokens/route";
import { GET, PATCH } from "@/app/api/review-tokens/[token]/route";

// ─── POST /api/review-tokens ─────────────────────────────────────────────────

describe("POST /api/review-tokens — happy path (admin creates review link)", () => {
  it("returns 201 with token and url for a valid clientName", async () => {
    const req = new NextRequest("http://localhost/api/review-tokens", {
      method: "POST",
      body: JSON.stringify({ clientName: "María García" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.token).toBe("mock-uuid-token-abc");
    expect(body.data.url).toContain("/resena/mock-uuid-token-abc");
  });

  it("returns 400 when clientName is missing", async () => {
    const req = new NextRequest("http://localhost/api/review-tokens", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 400 when clientName is blank", async () => {
    const req = new NextRequest("http://localhost/api/review-tokens", {
      method: "POST",
      body: JSON.stringify({ clientName: "   " }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 401 when session is not authenticated", async () => {
    const { verifySession } = await import("@/lib/auth/verifySession");
    vi.mocked(verifySession).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/review-tokens", {
      method: "POST",
      body: JSON.stringify({ clientName: "María García" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });
});

// ─── GET /api/review-tokens/[token] ──────────────────────────────────────────

describe("GET /api/review-tokens/[token] — happy path (public validates token)", () => {
  const makeParams = (token: string) => ({
    params: Promise.resolve({ token }),
  });

  it("returns 200 with clientName and expiresAt for a valid token", async () => {
    const req = new NextRequest("http://localhost/api/review-tokens/mock-uuid-token-abc");
    const res = await GET(req, makeParams("mock-uuid-token-abc"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.clientName).toBe("María García");
    expect(body.data.used).toBe(false);
  });

  it("returns 410 with code TOKEN_USED when service throws TOKEN_USED", async () => {
    const { getTokenForClient } = await import("@/lib/services/reviewTokenService");
    vi.mocked(getTokenForClient).mockRejectedValueOnce(new Error("TOKEN_USED"));

    const req = new NextRequest("http://localhost/api/review-tokens/used-token");
    const res = await GET(req, makeParams("used-token"));
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body.success).toBe(false);
    expect(body.code).toBe("TOKEN_USED");
  });

  it("returns 410 with code TOKEN_EXPIRED when token is expired", async () => {
    const { getTokenForClient } = await import("@/lib/services/reviewTokenService");
    vi.mocked(getTokenForClient).mockRejectedValueOnce(new Error("TOKEN_EXPIRED"));

    const req = new NextRequest("http://localhost/api/review-tokens/expired-token");
    const res = await GET(req, makeParams("expired-token"));
    const body = await res.json();

    expect(res.status).toBe(410);
    expect(body.success).toBe(false);
    expect(body.code).toBe("TOKEN_EXPIRED");
  });

  it("returns 404 when token does not exist", async () => {
    const { getTokenForClient } = await import("@/lib/services/reviewTokenService");
    vi.mocked(getTokenForClient).mockRejectedValueOnce(new Error("TOKEN_NOT_FOUND"));

    const req = new NextRequest("http://localhost/api/review-tokens/nonexistent");
    const res = await GET(req, makeParams("nonexistent"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });
});

// ─── PATCH /api/review-tokens/[token] ────────────────────────────────────────

describe("PATCH /api/review-tokens/[token] — happy path (public consumes token)", () => {
  const makeParams = (token: string) => ({
    params: Promise.resolve({ token }),
  });

  it("returns 200 with consumed: true after marking the token used", async () => {
    const req = new NextRequest("http://localhost/api/review-tokens/mock-uuid-token-abc", {
      method: "PATCH",
    });
    const res = await PATCH(req, makeParams("mock-uuid-token-abc"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.consumed).toBe(true);
  });
});
