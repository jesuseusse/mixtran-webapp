import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/verifySession", () => ({
  verifySession: vi.fn().mockResolvedValue({ email: "admin@mixtran.com" }),
}));

vi.mock("@/lib/services/quoteService", () => ({
  createQuote: vi.fn().mockResolvedValue({
    quoteId: "q-001",
    quoteNumber: "COT-0001",
    status: "draft",
    clientName: "Carlos Rodríguez",
    items: [
      {
        lineId: "l-001",
        name: "Pintura vinílica",
        unit: "lt",
        quantity: 10,
        unitPrice: 350,
        discountPercent: 0,
        lineTotal: 3500,
      },
    ],
    subtotal: 3500,
    ivaPercent: 16,
    ivaAmount: 560,
    total: 4060,
    currency: { code: "MXN", symbol: "$", label: "Peso mexicano" },
    validUntil: "2024-02-01",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  }),
  getQuotes: vi.fn().mockResolvedValue([]),
  getQuote: vi.fn().mockResolvedValue(null),
  updateQuote: vi.fn().mockResolvedValue(null),
  deleteQuote: vi.fn().mockResolvedValue(undefined),
  updateStatus: vi.fn().mockResolvedValue(null),
  computeLineTotal: vi.fn(),
  computeTotals: vi.fn(),
}));

import { POST } from "@/app/api/quotes/route";

describe("POST /api/quotes — creates quote", () => {
  it("returns 201 with folio, computed totals, and status=draft", async () => {
    const req = new NextRequest("http://localhost/api/quotes", {
      method: "POST",
      body: JSON.stringify({
        clientName: "Carlos Rodríguez",
        status: "draft",
        ivaPercent: 16,
        currency: { code: "MXN", symbol: "$", label: "Peso mexicano" },
        validUntil: "2024-02-01",
        items: [
          {
            lineId: "l-001",
            name: "Pintura vinílica",
            unit: "lt",
            quantity: 10,
            unitPrice: 350,
            discountPercent: 0,
            lineTotal: 3500,
          },
        ],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.quoteNumber).toBe("COT-0001");
    expect(body.data.status).toBe("draft");
    expect(body.data.subtotal).toBe(3500);
    expect(body.data.ivaAmount).toBe(560);
    expect(body.data.total).toBe(4060);
  });
});
