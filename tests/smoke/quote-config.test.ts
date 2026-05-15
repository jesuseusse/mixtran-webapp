import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/verifySession", () => ({
  verifySession: vi.fn().mockResolvedValue({ email: "admin@mixtran.com" }),
}));

vi.mock("@/lib/services/quoteConfigService", () => ({
  getConfig: vi.fn().mockResolvedValue(null),
  saveConfig: vi.fn().mockResolvedValue({
    configId: "main",
    businessName: "Pinturas del Norte",
    taxId: "PDN-123456-789",
    taxIdLabel: "RFC",
    address: "Calle Primero 1, Monterrey",
    phone: "8112345678",
    email: "admin@pinturasdelnorte.mx",
    currency: { code: "MXN", symbol: "$", label: "Peso mexicano" },
    ivaPercent: 16,
    defaultValidityDays: 15,
    folioPrefix: "COT-",
    lastFolioNumber: 0,
    updatedAt: "2024-01-01T00:00:00Z",
  }),
  getNextFolioNumber: vi.fn().mockResolvedValue("COT-0001"),
}));

import { GET, PATCH } from "@/app/api/quotes/config/route";

describe("GET /api/quotes/config — unconfigured", () => {
  it("returns 200 with null data when config is not set", async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });
});

describe("PATCH /api/quotes/config — saves config", () => {
  it("returns 200 with the saved config", async () => {
    const req = new NextRequest("http://localhost/api/quotes/config", {
      method: "PATCH",
      body: JSON.stringify({
        businessName: "Pinturas del Norte",
        taxId: "PDN-123456-789",
        taxIdLabel: "RFC",
        address: "Calle Primero 1, Monterrey",
        phone: "8112345678",
        email: "admin@pinturasdelnorte.mx",
        currency: { code: "MXN", symbol: "$", label: "Peso mexicano" },
        ivaPercent: 16,
        defaultValidityDays: 15,
        folioPrefix: "COT-",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.businessName).toBe("Pinturas del Norte");
    expect(body.data.folioPrefix).toBe("COT-");
  });
});
