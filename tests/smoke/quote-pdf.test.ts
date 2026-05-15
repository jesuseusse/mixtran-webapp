import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/verifySession", () => ({
  verifySession: vi.fn().mockResolvedValue({ email: "admin@mixtran.com" }),
}));

vi.mock("@/lib/services/quotePdfService", () => ({
  generateAndUpload: vi.fn().mockResolvedValue(
    "https://cdn.example.com/quotes/pdfs/q-001.pdf"
  ),
}));

import { POST } from "@/app/api/quotes/[quoteId]/pdf/route";

describe("POST /api/quotes/[quoteId]/pdf — generates PDF", () => {
  it("calls generateAndUpload and returns a CloudFront URL", async () => {
    const req = new NextRequest("http://localhost/api/quotes/q-001/pdf", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ quoteId: "q-001" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.url).toBe("https://cdn.example.com/quotes/pdfs/q-001.pdf");
  });
});
