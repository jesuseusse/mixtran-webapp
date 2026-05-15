import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/verifySession", () => ({
  verifySession: vi.fn().mockResolvedValue({ email: "admin@mixtran.com" }),
}));

vi.mock("@/lib/services/quoteService", () => {
  const base = {
    quoteId: "q-001",
    quoteNumber: "COT-0001",
    clientName: "Carlos Rodríguez",
    items: [],
    subtotal: 0,
    ivaPercent: 16,
    ivaAmount: 0,
    total: 0,
    currency: { code: "MXN", symbol: "$", label: "Peso mexicano" },
    validUntil: "2024-02-01",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };
  return {
    updateStatus: vi
      .fn()
      .mockResolvedValueOnce({ ...base, status: "sent" })
      .mockResolvedValueOnce({ ...base, status: "accepted" }),
    getQuotes: vi.fn().mockResolvedValue([]),
    getQuote: vi.fn().mockResolvedValue({ ...base, status: "draft" }),
    createQuote: vi.fn(),
    updateQuote: vi.fn(),
    deleteQuote: vi.fn(),
  };
});

import { PATCH } from "@/app/api/quotes/[quoteId]/status/route";

describe("PATCH /api/quotes/[quoteId]/status — transitions status", () => {
  it("transitions draft → sent", async () => {
    const req = new NextRequest("http://localhost/api/quotes/q-001/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "sent" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req, { params: Promise.resolve({ quoteId: "q-001" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("sent");
  });

  it("transitions sent → accepted", async () => {
    const req = new NextRequest("http://localhost/api/quotes/q-001/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "accepted" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req, { params: Promise.resolve({ quoteId: "q-001" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("accepted");
  });
});
