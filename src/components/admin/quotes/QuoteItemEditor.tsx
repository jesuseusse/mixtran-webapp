"use client";

import type { QuoteItem } from "@/lib/types/Quote";
import type { QuoteCatalogItem } from "@/lib/types/QuoteCatalogItem";
import { ProductAutocomplete } from "./ProductAutocomplete";

interface QuoteItemEditorProps {
  items: QuoteItem[];
  catalog: QuoteCatalogItem[];
  currencySymbol: string;
  onChange: (items: QuoteItem[]) => void;
  className?: string;
}

function newItem(): QuoteItem {
  return {
    lineId: crypto.randomUUID(),
    name: "",
    unit: "pza",
    quantity: 1,
    unitPrice: 0,
    discountPercent: 0,
    lineTotal: 0,
  };
}

function recalc(item: QuoteItem): QuoteItem {
  return {
    ...item,
    lineTotal:
      item.quantity * item.unitPrice * (1 - item.discountPercent / 100),
  };
}

/**
 * Editor for quote line items.
 * Mobile: card per line. Desktop: table row per line.
 */
export function QuoteItemEditor({
  items,
  catalog,
  currencySymbol,
  onChange,
  className = "",
}: QuoteItemEditorProps) {
  function updateItem(lineId: string, patch: Partial<QuoteItem>) {
    onChange(
      items.map((i) =>
        i.lineId === lineId ? recalc({ ...i, ...patch }) : i
      )
    );
  }

  function removeItem(lineId: string) {
    onChange(items.filter((i) => i.lineId !== lineId));
  }

  function addItem() {
    onChange([...items, newItem()]);
  }

  function handleProductSelect(lineId: string, name: string, catalogItem?: QuoteCatalogItem) {
    const patch: Partial<QuoteItem> = { name };
    if (catalogItem) {
      patch.productId = catalogItem.productId;
      patch.unit = catalogItem.unit;
      patch.unitPrice = catalogItem.unitPrice;
      patch.description = catalogItem.description;
    }
    updateItem(lineId, patch);
  }

  const fmt = (n: number) =>
    `${currencySymbol}${n.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {items.map((item) => (
          <div
            key={item.lineId}
            className="rounded-xl border border-border bg-surface p-4 space-y-3"
          >
            <ProductAutocomplete
              catalog={catalog}
              value={item.name}
              onChange={(name, cat) => handleProductSelect(item.lineId, name, cat)}
              placeholder="Producto / servicio…"
            />
            {item.description !== undefined && (
              <input
                type="text"
                value={item.description ?? ""}
                onChange={(e) => updateItem(item.lineId, { description: e.target.value })}
                placeholder="Descripción (opcional)"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Cant.</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.lineId, { quantity: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Unidad</span>
                <input
                  type="text"
                  value={item.unit}
                  onChange={(e) => updateItem(item.lineId, { unit: e.target.value })}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Precio {currencySymbol}</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(item.lineId, { unitPrice: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-text-muted">Dto. %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={item.discountPercent}
                  onChange={(e) =>
                    updateItem(item.lineId, {
                      discountPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text-primary">
                Total: {fmt(item.lineTotal)}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.lineId)}
                className="text-danger text-sm hover:underline min-h-[44px] px-2"
              >
                ✕ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      {items.length > 0 && (
        <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background text-text-muted text-left">
                <th className="px-3 py-2 font-medium">Producto</th>
                <th className="px-3 py-2 font-medium w-20">Cant.</th>
                <th className="px-3 py-2 font-medium w-24">Unidad</th>
                <th className="px-3 py-2 font-medium w-28">Precio {currencySymbol}</th>
                <th className="px-3 py-2 font-medium w-20">Dto. %</th>
                <th className="px-3 py-2 font-medium w-28 text-right">Total</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.lineId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <ProductAutocomplete
                      catalog={catalog}
                      value={item.name}
                      onChange={(name, cat) => handleProductSelect(item.lineId, name, cat)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.lineId, { quantity: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(item.lineId, { unit: e.target.value })}
                      className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(item.lineId, { unitPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={item.discountPercent}
                      onChange={(e) =>
                        updateItem(item.lineId, {
                          discountPercent: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(item.lineTotal)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.lineId)}
                      className="text-danger hover:text-danger/70 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Eliminar línea"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={addItem}
        className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-text-muted hover:border-primary hover:text-primary transition-colors min-h-[44px]"
      >
        + Agregar producto
      </button>
    </div>
  );
}
