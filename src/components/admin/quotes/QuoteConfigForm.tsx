"use client";

import { useState, useEffect, useRef } from "react";
import type { QuoteConfig, UpdateQuoteConfigInput, CurrencyOption } from "@/lib/types/QuoteConfig";
import { CURRENCY_OPTIONS } from "@/lib/types/QuoteConfig";

const DRAFT_KEY = "quote_config_draft";

function readDraft<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface QuoteConfigFormProps {
  initialConfig: QuoteConfig | null;
  className?: string;
}

function emptyForm(): UpdateQuoteConfigInput {
  return {
    businessName: "",
    taxId: "",
    taxIdLabel: "RFC",
    address: "",
    phone: "",
    email: "",
    currency: CURRENCY_OPTIONS[0],
    ivaPercent: 16,
    defaultValidityDays: 15,
    folioPrefix: "COT-",
    defaultNotes: "",
    termsText: "",
    bankDetails: "",
  };
}

/** Quote business configuration form with localStorage auto-save. */
export function QuoteConfigForm({ initialConfig, className = "" }: QuoteConfigFormProps) {
  const [form, setForm] = useState<UpdateQuoteConfigInput>(() => {
    const saved = readDraft<UpdateQuoteConfigInput | null>(DRAFT_KEY, null);
    if (saved) return saved;
    if (initialConfig) {
      const { configId: _c, lastFolioNumber: _l, updatedAt: _u, ...rest } = initialConfig;
      return rest;
    }
    return emptyForm();
  });

  const [customCurrency, setCustomCurrency] = useState<CurrencyOption>({ code: "", symbol: "", label: "" });
  const [isOtherCurrency, setIsOtherCurrency] = useState(
    !CURRENCY_OPTIONS.some((c) => c.code === (initialConfig?.currency?.code ?? "MXN")) &&
      initialConfig != null
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  /* Auto-save draft. */
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* Ignore. */
    }
  }, [form]);

  function set(partial: Partial<UpdateQuoteConfigInput>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function handleCurrencyChange(code: string) {
    if (code === "OTHER") {
      setIsOtherCurrency(true);
      set({ currency: customCurrency });
    } else {
      setIsOtherCurrency(false);
      const opt = CURRENCY_OPTIONS.find((c) => c.code === code) ?? CURRENCY_OPTIONS[0];
      set({ currency: opt });
    }
  }

  function handleCustomCurrency(partial: Partial<CurrencyOption>) {
    const updated = { ...customCurrency, ...partial };
    setCustomCurrency(updated);
    set({ currency: updated });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const res = await fetch("/api/quotes/config/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Error al preparar la carga del logo");
        return;
      }
      const { uploadUrl, publicUrl } = json.data as { uploadUrl: string; publicUrl: string };

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      set({ logoUrl: publicUrl });
    } catch {
      setError("Error al subir el logo");
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/quotes/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Error al guardar la configuración");
        return;
      }
      localStorage.removeItem(DRAFT_KEY);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] w-full";

  return (
    <form onSubmit={handleSubmit} className={`space-y-8 ${className}`}>
      {/* ── Datos del emisor ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-text-primary border-b border-border pb-2">
          Datos del emisor
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium text-text-primary">
              Nombre del negocio <span className="text-danger">*</span>
            </span>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => set({ businessName: e.target.value })}
              className={inputCls}
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-primary">
              Tipo de Registro Fiscal
            </span>
            <input
              type="text"
              value={form.taxIdLabel}
              onChange={(e) => set({ taxIdLabel: e.target.value })}
              placeholder="RFC, RIF, NIT…"
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-primary">
              Número de Registro Fiscal
            </span>
            <input
              type="text"
              value={form.taxId}
              onChange={(e) => set({ taxId: e.target.value })}
              placeholder="RFC, RIF, NIT…"
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm font-medium text-text-primary">Dirección</span>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set({ address: e.target.value })}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-primary">Teléfono</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-primary">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set({ email: e.target.value })}
              className={inputCls}
            />
          </label>
        </div>
      </section>

      {/* ── Logo ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-text-primary border-b border-border pb-2">
          Logo
        </h2>
        <div className="flex items-center gap-4">
          {form.logoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={form.logoUrl}
              alt="Logo del negocio"
              className="h-16 w-16 rounded-lg object-contain border border-border"
            />
          )}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:border-primary transition-colors min-h-[44px] disabled:opacity-50"
            >
              {logoUploading ? "Subiendo…" : "Subir logo"}
            </button>
            <p className="text-xs text-text-muted">JPEG, PNG, WebP o AVIF · Máx. recomendado 500 KB</p>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
      </section>

      {/* ── Configuración de cotizaciones ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-text-primary border-b border-border pb-2">
          Configuración de cotizaciones
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-primary">Moneda</span>
            <select
              value={isOtherCurrency ? "OTHER" : form.currency.code}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className={inputCls}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
          </label>

          {isOtherCurrency && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-text-primary">Símbolo</span>
                <input
                  type="text"
                  value={customCurrency.symbol}
                  onChange={(e) => handleCustomCurrency({ symbol: e.target.value })}
                  className={inputCls}
                  placeholder="$"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-text-primary">Código</span>
                <input
                  type="text"
                  value={customCurrency.code}
                  onChange={(e) => handleCustomCurrency({ code: e.target.value })}
                  className={inputCls}
                  placeholder="MXN"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-text-primary">Nombre</span>
                <input
                  type="text"
                  value={customCurrency.label}
                  onChange={(e) => handleCustomCurrency({ label: e.target.value })}
                  className={inputCls}
                  placeholder="Peso mexicano"
                />
              </label>
            </>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-primary">IVA %</span>
            <input
              type="number"
              min="0"
              max="100"
              value={form.ivaPercent}
              onChange={(e) => set({ ivaPercent: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-primary">Vigencia por defecto (días)</span>
            <input
              type="number"
              min="1"
              value={form.defaultValidityDays}
              onChange={(e) => set({ defaultValidityDays: parseInt(e.target.value) || 15 })}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-primary">Prefijo de folio</span>
            <input
              type="text"
              value={form.folioPrefix}
              onChange={(e) => set({ folioPrefix: e.target.value })}
              className={inputCls}
              placeholder="COT-"
            />
          </label>
        </div>
      </section>

      {/* ── Textos por defecto ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-text-primary border-b border-border pb-2">
          Textos por defecto
        </h2>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-primary">Notas por defecto</span>
          <textarea
            rows={3}
            value={form.defaultNotes ?? ""}
            onChange={(e) => set({ defaultNotes: e.target.value })}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-y w-full"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-primary">Términos y condiciones</span>
          <textarea
            rows={4}
            value={form.termsText ?? ""}
            onChange={(e) => set({ termsText: e.target.value })}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-y w-full"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text-primary">
            Datos bancarios <span className="text-text-muted text-xs">(opcional)</span>
          </span>
          <textarea
            rows={3}
            value={form.bankDetails ?? ""}
            onChange={(e) => set({ bankDetails: e.target.value })}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-y w-full"
          />
        </label>
      </section>

      {/* ── Feedback ── */}
      {error && (
        <p className="rounded-lg bg-danger/10 text-danger px-4 py-3 text-sm">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-success/10 text-success px-4 py-3 text-sm">
          Configuración guardada correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-on-primary hover:bg-secondary transition-colors min-h-[44px] disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar configuración"}
      </button>
    </form>
  );
}
