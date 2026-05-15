"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { QuoteItem, QuoteStatus } from "@/lib/types/Quote";
import type { QuoteConfig } from "@/lib/types/QuoteConfig";
import type { QuoteCatalogItem } from "@/lib/types/QuoteCatalogItem";
import { QuoteItemEditor } from "./QuoteItemEditor";

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------
const DRAFT_KEY = "quote_wizard_draft";

function readDraft<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Wizard state type
// ---------------------------------------------------------------------------
interface WizardState {
  step: number;
  clientName: string;
  clientCompany: string;
  clientTaxId: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: QuoteItem[];
  ivaPercent: number;
  validUntil: string;
  notes: string;
  status: QuoteStatus;
}

function defaultState(config: QuoteConfig | null): WizardState {
  const days = config?.defaultValidityDays ?? 15;
  const validUntil = new Date(Date.now() + days * 86400000)
    .toISOString()
    .slice(0, 10);
  return {
    step: 1,
    clientName: "",
    clientCompany: "",
    clientTaxId: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    items: [],
    ivaPercent: config?.ivaPercent ?? 16,
    validUntil,
    notes: config?.defaultNotes ?? "",
    status: "draft",
  };
}

const STEP_LABELS = ["Cliente", "Productos", "Montos", "Notas", "Revisión"];

// ---------------------------------------------------------------------------
// QuoteWizard
// ---------------------------------------------------------------------------
interface QuoteWizardProps {
  config: QuoteConfig | null;
  catalog: QuoteCatalogItem[];
}

/** 5-step quote creation wizard with localStorage auto-save. */
export function QuoteWizard({ config, catalog }: QuoteWizardProps) {
  const router = useRouter();

  const [state, setState] = useState<WizardState>(() => {
    const saved = readDraft<WizardState | null>(DRAFT_KEY, null);
    return saved ?? defaultState(config);
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Auto-save on every state change. */
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    } catch {
      /* Ignore storage errors. */
    }
  }, [state]);

  function set(partial: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...partial }));
  }

  function goTo(step: number) {
    set({ step });
  }

  const sym = config?.currency.symbol ?? "$";

  const subtotal = state.items.reduce((s, i) => s + i.lineTotal, 0);
  const ivaAmount = subtotal * (state.ivaPercent / 100);
  const total = subtotal + ivaAmount;

  const fmt = (n: number) =>
    `${sym}${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

  async function handleSave(finalStatus: QuoteStatus) {
    if (!state.clientName.trim()) {
      setError("El nombre del cliente es requerido.");
      set({ step: 1 });
      return;
    }
    if (state.items.length === 0) {
      setError("Agrega al menos un producto.");
      set({ step: 2 });
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const currency = config?.currency ?? {
        code: "MXN",
        symbol: "$",
        label: "Peso mexicano",
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: finalStatus,
          clientName: state.clientName.trim(),
          clientCompany: state.clientCompany.trim() || undefined,
          clientTaxId: state.clientTaxId.trim() || undefined,
          clientEmail: state.clientEmail.trim() || undefined,
          clientPhone: state.clientPhone.trim() || undefined,
          clientAddress: state.clientAddress.trim() || undefined,
          items: state.items,
          ivaPercent: state.ivaPercent,
          currency,
          validUntil: state.validUntil,
          notes: state.notes.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        if (json.code === "QUOTE_CONFIG_MISSING") {
          setError("Configura los datos del negocio antes de crear una cotización.");
        } else {
          setError(json.error ?? "Error al guardar la cotización.");
        }
        return;
      }

      localStorage.removeItem(DRAFT_KEY);
      router.push(`/dashboard/quotes/${json.data.quoteId}`);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  // ── Config gate ──
  if (!config) {
    return (
      <div className="rounded-xl border border-warning bg-warning/10 p-6 text-center space-y-3">
        <p className="text-text-primary font-medium">
          Antes de crear una cotización, configura los datos de tu negocio.
        </p>
        <Link
          href="/dashboard/quotes/settings"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-secondary transition-colors min-h-[44px]"
        >
          Ir a Configuración
        </Link>
      </div>
    );
  }

  // ── Step indicator ──
  const stepIndicator = (
    <div
      className="flex gap-1 overflow-x-auto pb-1"
      style={{ whiteSpace: "nowrap" }}
    >
      {STEP_LABELS.map((label, idx) => {
        const n = idx + 1;
        const active = n === state.step;
        const done = n < state.step;
        return (
          <button
            key={n}
            type="button"
            onClick={() => goTo(n)}
            className={`flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors min-h-[44px] ${
              active
                ? "bg-primary text-on-primary"
                : done
                ? "bg-accent text-on-accent"
                : "bg-surface text-text-muted border border-border"
            }`}
          >
            {n} · {label}
          </button>
        );
      })}
    </div>
  );

  const navButtons = (
    <div className="flex gap-3 justify-between">
      {state.step > 1 ? (
        <button
          type="button"
          onClick={() => goTo(state.step - 1)}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:border-primary transition-colors min-h-[44px]"
        >
          Anterior
        </button>
      ) : (
        <span />
      )}
      {state.step < 5 ? (
        <button
          type="button"
          onClick={() => goTo(state.step + 1)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-secondary transition-colors min-h-[44px]"
        >
          Siguiente
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      {stepIndicator}

      {error && (
        <p className="rounded-lg bg-danger/10 text-danger px-4 py-3 text-sm">{error}</p>
      )}

      {/* ── Step 1: Cliente ── */}
      {state.step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Datos del cliente</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm font-medium text-text-primary">
                Nombre del cliente <span className="text-danger">*</span>
              </span>
              <input
                type="text"
                value={state.clientName}
                onChange={(e) => set({ clientName: e.target.value })}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                placeholder="Nombre completo o razón social"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-primary">Empresa</span>
              <input
                type="text"
                value={state.clientCompany}
                onChange={(e) => set({ clientCompany: e.target.value })}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-primary">
                Número de Registro Fiscal
              </span>
              <input
                type="text"
                value={state.clientTaxId}
                onChange={(e) => set({ clientTaxId: e.target.value })}
                placeholder="RFC, RIF, NIT…"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-primary">
                Email <span className="text-text-muted text-xs">(opcional)</span>
              </span>
              <input
                type="email"
                value={state.clientEmail}
                onChange={(e) => set({ clientEmail: e.target.value })}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-text-primary">Teléfono</span>
              <input
                type="tel"
                value={state.clientPhone}
                onChange={(e) => set({ clientPhone: e.target.value })}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm font-medium text-text-primary">Dirección</span>
              <input
                type="text"
                value={state.clientAddress}
                onChange={(e) => set({ clientAddress: e.target.value })}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            </label>
          </div>
          {navButtons}
        </div>
      )}

      {/* ── Step 2: Productos ── */}
      {state.step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Productos y servicios</h2>
          <QuoteItemEditor
            items={state.items}
            catalog={catalog}
            currencySymbol={sym}
            onChange={(items) => set({ items })}
          />
          {navButtons}
        </div>
      )}

      {/* ── Step 3: Montos ── */}
      {state.step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Montos</h2>

          {/* Line summary */}
          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            {state.items.map((item) => (
              <div key={item.lineId} className="flex justify-between px-4 py-2 text-sm">
                <span className="text-text-primary">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">{fmt(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          {/* IVA override */}
          <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm font-medium text-text-primary w-40">IVA %</span>
            <input
              type="number"
              min="0"
              max="100"
              value={state.ivaPercent}
              onChange={(e) =>
                set({ ivaPercent: parseFloat(e.target.value) || 0 })
              }
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] w-28"
            />
          </label>

          {/* Validity */}
          <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm font-medium text-text-primary w-40">Válida hasta</span>
            <input
              type="date"
              value={state.validUntil}
              onChange={(e) => set({ validUntil: e.target.value })}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            />
          </label>

          {/* Totals summary */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">IVA ({state.ivaPercent}%)</span>
              <span>{fmt(ivaAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t border-border pt-2">
              <span>Total</span>
              <span className="text-primary">{fmt(total)}</span>
            </div>
          </div>

          {navButtons}
        </div>
      )}

      {/* ── Step 4: Notas ── */}
      {state.step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Notas y términos</h2>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-primary">Notas</span>
            <textarea
              rows={4}
              value={state.notes}
              onChange={(e) => set({ notes: e.target.value })}
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            />
          </label>
          {config.termsText && (
            <div className="rounded-xl border border-border bg-background p-4 space-y-1">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
                Términos y condiciones
              </p>
              <p className="text-sm text-text-secondary whitespace-pre-line">
                {config.termsText}
              </p>
              <Link
                href="/dashboard/quotes/settings"
                className="text-xs text-primary hover:underline"
              >
                Editar en configuración
              </Link>
            </div>
          )}
          {navButtons}
        </div>
      )}

      {/* ── Step 5: Revisión ── */}
      {state.step === 5 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Revisión</h2>

          {/* Client summary */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
              Cliente
            </p>
            <p className="text-sm font-semibold">{state.clientName}</p>
            {state.clientCompany && (
              <p className="text-sm text-text-muted">{state.clientCompany}</p>
            )}
            {state.clientTaxId && (
              <p className="text-sm text-text-muted">RFC/RIF: {state.clientTaxId}</p>
            )}
            {state.clientEmail && (
              <p className="text-sm text-text-muted">{state.clientEmail}</p>
            )}
            {state.clientPhone && (
              <p className="text-sm text-text-muted">{state.clientPhone}</p>
            )}
          </div>

          {/* Items summary */}
          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            <p className="px-4 py-2 text-xs font-medium text-text-muted uppercase tracking-wide">
              Productos
            </p>
            {state.items.map((item) => (
              <div key={item.lineId} className="flex justify-between px-4 py-2 text-sm">
                <span>
                  {item.name} × {item.quantity} {item.unit}
                  {item.discountPercent > 0 && (
                    <span className="text-text-muted ml-1">(-{item.discountPercent}%)</span>
                  )}
                </span>
                <span className="font-medium">{fmt(item.lineTotal)}</span>
              </div>
            ))}
            <div className="px-4 py-2 space-y-1">
              <div className="flex justify-between text-sm text-text-muted">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-muted">
                <span>IVA ({state.ivaPercent}%)</span>
                <span>{fmt(ivaAmount)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span className="text-primary">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Validity */}
          <p className="text-sm text-text-muted">
            Vigencia hasta:{" "}
            {new Date(state.validUntil).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>

          {/* Action buttons — sticky on mobile */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface p-4 flex gap-3 md:static md:border-0 md:p-0 md:bg-transparent">
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary hover:border-primary transition-colors min-h-[44px] disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              type="button"
              onClick={() => handleSave("sent")}
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-secondary transition-colors min-h-[44px] disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cotización"}
            </button>
          </div>

          {/* Extra bottom padding on mobile so content isn't hidden behind sticky bar. */}
          <div className="h-20 md:hidden" />

          <button
            type="button"
            onClick={() => goTo(4)}
            className="text-sm text-text-muted hover:text-primary"
          >
            ← Volver a editar
          </button>
        </div>
      )}
    </div>
  );
}
