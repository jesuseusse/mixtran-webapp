"use client";

import { useState, useRef, useEffect } from "react";
import type { QuoteCatalogItem } from "@/lib/types/QuoteCatalogItem";

interface ProductAutocompleteProps {
  catalog: QuoteCatalogItem[];
  value: string;
  onChange: (value: string, item?: QuoteCatalogItem) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Text input with client-side catalog autocomplete.
 * Selecting an item from the dropdown passes the full catalog item to onChange.
 * Typing a custom name (not in catalog) passes only the string.
 */
export function ProductAutocomplete({
  catalog,
  value,
  onChange,
  placeholder = "Producto o servicio…",
  className = "",
}: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value.trim().length === 0
    ? catalog.slice(0, 10)
    : catalog.filter((i) =>
        i.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setOpen(true);
  }

  function handleSelect(item: QuoteCatalogItem) {
    onChange(item.name, item);
    setOpen(false);
  }

  /* Close dropdown when clicking outside. */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
        autoComplete="off"
      />

      {open && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {filtered.map((item) => (
            <li key={item.productId}>
              <button
                type="button"
                onMouseDown={() => handleSelect(item)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-background flex justify-between items-center min-h-[44px]"
              >
                <span className="font-medium text-text-primary">{item.name}</span>
                <span className="text-xs text-text-muted">{item.unit}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
