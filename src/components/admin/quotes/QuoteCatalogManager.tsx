"use client";

import { useState } from "react";
import type { QuoteCatalogItem, CreateCatalogItemInput } from "@/lib/types/QuoteCatalogItem";

interface QuoteCatalogManagerProps {
  initialItems: QuoteCatalogItem[];
  className?: string;
}

const inputCls =
  "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] w-full";

/** Manages the quote product catalog: list, add, edit, and delete items. */
export function QuoteCatalogManager({ initialItems, className = "" }: QuoteCatalogManagerProps) {
  const [items, setItems] = useState<QuoteCatalogItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<QuoteCatalogItem>>({});
  const [newForm, setNewForm] = useState<CreateCatalogItemInput>({
    name: "",
    unit: "pza",
    unitPrice: 0,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quotes/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Error al agregar el producto");
        return;
      }
      setItems((prev) => [json.data as QuoteCatalogItem, ...prev]);
      setNewForm({ name: "", unit: "pza", unitPrice: 0 });
      setShowAdd(false);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(productId: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/catalog/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Error al actualizar");
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.productId === productId ? (json.data as QuoteCatalogItem) : i))
      );
      setEditingId(null);
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("¿Eliminar este producto del catálogo?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/catalog/${productId}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Error al eliminar");
        return;
      }
      setItems((prev) => prev.filter((i) => i.productId !== productId));
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: QuoteCatalogItem) {
    setEditingId(item.productId);
    setEditForm({ name: item.name, unit: item.unit, unitPrice: item.unitPrice, description: item.description, category: item.category });
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">Catálogo de productos</h3>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-secondary transition-colors min-h-[44px]"
        >
          + Agregar
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-danger/10 text-danger px-4 py-3 text-sm">{error}</p>
      )}

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <p className="text-sm font-medium text-text-primary">Nuevo producto</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs text-text-muted">Nombre *</span>
              <input
                type="text"
                required
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Unidad</span>
              <input
                type="text"
                value={newForm.unit}
                onChange={(e) => setNewForm((f) => ({ ...f, unit: e.target.value }))}
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-text-muted">Precio</span>
              <input
                type="number"
                min="0"
                step="any"
                value={newForm.unitPrice}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))
                }
                className={inputCls}
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs text-text-muted">Descripción</span>
              <input
                type="text"
                value={newForm.description ?? ""}
                onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                className={inputCls}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-secondary transition-colors min-h-[44px] disabled:opacity-50"
            >
              {loading ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary hover:border-primary transition-colors min-h-[44px]"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Items list */}
      {items.length === 0 && (
        <p className="text-center text-text-muted py-8 text-sm">
          No hay productos en el catálogo todavía.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) =>
          editingId === item.productId ? (
            <div key={item.productId} className="rounded-xl border border-primary bg-surface p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs text-text-muted">Nombre</span>
                  <input
                    type="text"
                    value={editForm.name ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Unidad</span>
                  <input
                    type="text"
                    value={editForm.unit ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                    className={inputCls}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-text-muted">Precio</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.unitPrice ?? 0}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))
                    }
                    className={inputCls}
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdate(item.productId)}
                  disabled={loading}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-secondary transition-colors min-h-[44px] disabled:opacity-50"
                >
                  {loading ? "Guardando…" : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary min-h-[44px]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div
              key={item.productId}
              className="rounded-xl border border-border bg-surface p-4 flex items-start justify-between gap-3"
            >
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                {item.description && (
                  <p className="text-xs text-text-muted truncate">{item.description}</p>
                )}
                <p className="text-xs text-text-muted">
                  {item.unit} · ${item.unitPrice.toFixed(2)}
                  {item.usageCount > 0 && ` · usado ${item.usageCount}×`}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="text-sm text-primary hover:underline min-h-[44px] px-1"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.productId)}
                  className="text-sm text-danger hover:underline min-h-[44px] px-1"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
