import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/verifySession", () => ({
  verifySession: vi.fn().mockResolvedValue({ email: "admin@mixtran.com" }),
}));

vi.mock("@/lib/services/quoteCatalogService", () => ({
  getAllItems: vi.fn().mockResolvedValue([
    {
      productId: "prod-001",
      name: "Pintura vinílica",
      unit: "lt",
      unitPrice: 350,
      usageCount: 5,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ]),
  addItem: vi.fn().mockResolvedValue({
    productId: "prod-001",
    name: "Pintura vinílica",
    unit: "lt",
    unitPrice: 350,
    usageCount: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  }),
  updateItem: vi.fn().mockResolvedValue(null),
  deleteItem: vi.fn().mockResolvedValue(undefined),
  upsertFromQuoteItem: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from "@/app/api/quotes/catalog/route";

describe("GET /api/quotes/catalog — returns sorted list", () => {
  it("returns 200 with catalog items", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data[0].name).toBe("Pintura vinílica");
    expect(body.data[0].usageCount).toBe(5);
  });
});

describe("POST /api/quotes/catalog — creates item", () => {
  it("returns 201 with the created item", async () => {
    const req = new NextRequest("http://localhost/api/quotes/catalog", {
      method: "POST",
      body: JSON.stringify({ name: "Pintura vinílica", unit: "lt", unitPrice: 350 }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Pintura vinílica");
  });
});
