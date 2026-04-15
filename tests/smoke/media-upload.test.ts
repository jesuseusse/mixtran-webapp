import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/verifySession", () => ({
  verifySession: vi.fn().mockResolvedValue({ email: "admin@mixtran.com" }),
}));

vi.mock("@/lib/aws/s3", () => ({
  s3Client: {},
}));

/** Presigner returns a deterministic fake URL so we can assert on it. */
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn().mockResolvedValue("https://s3.amazonaws.com/test-bucket/media/uuid.webp?X-Amz-Signature=abc"),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  PutObjectCommand: class {},
}));

import { POST } from "@/app/api/media/upload/route";

describe("POST /api/media/upload — happy path", () => {
  it("returns presigned uploadUrl and CloudFront publicUrl for a WebP file", async () => {
    const req = new NextRequest("http://localhost/api/media/upload", {
      method: "POST",
      body: JSON.stringify({ fileName: "photo.webp", contentType: "image/webp" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.uploadUrl).toContain("s3.amazonaws.com");
    expect(body.data.publicUrl).toMatch(/^https:\/\/cdn\.test\.com\/media\/.+\.webp$/);
  });

  it("returns presigned URL for a JPEG file", async () => {
    const req = new NextRequest("http://localhost/api/media/upload", {
      method: "POST",
      body: JSON.stringify({ fileName: "photo.jpg", contentType: "image/jpeg" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.publicUrl).toMatch(/^https:\/\/cdn\.test\.com\/media\/.+\.jpg$/);
  });

  it("returns 400 for a disallowed content type", async () => {
    const req = new NextRequest("http://localhost/api/media/upload", {
      method: "POST",
      body: JSON.stringify({ fileName: "doc.pdf", contentType: "application/pdf" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 400 when fileName or contentType is missing", async () => {
    const req = new NextRequest("http://localhost/api/media/upload", {
      method: "POST",
      body: JSON.stringify({ fileName: "photo.jpg" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it("returns 401 when the session is not authenticated", async () => {
    const { verifySession } = await import("@/lib/auth/verifySession");
    vi.mocked(verifySession).mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/media/upload", {
      method: "POST",
      body: JSON.stringify({ fileName: "photo.webp", contentType: "image/webp" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });
});
