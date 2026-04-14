"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

/** Navigation items for the admin dashboard sidebar. */
const NAV_ITEMS = [
  { href: "/dashboard",                    label: "Resumen"    },
  { href: "/dashboard/calendar",           label: "Calendario" },
  { href: "/dashboard/calendar/bookings",  label: "Reservas"   },
  { href: "/dashboard/contacts",           label: "Contactos"  },
  { href: "/dashboard/reviews",            label: "Reseñas"    },
  { href: "/dashboard/landing",            label: "Landing"    },
] as const;

/**
 * Admin dashboard sidebar.
 *
 * - Responsive: hidden on mobile, triggered by a hamburger button in the top bar.
 * - Active state: highlights the current route using usePathname().
 * - Loading state: logout button shows a spinner while the request is in flight.
 */
export function DashboardSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  /**
   * Determines whether a nav item should be marked active.
   * Exact match for /dashboard; for nested routes, only the most specific
   * matching prefix wins — prevents /dashboard/calendar from staying active
   * when the user is on /dashboard/calendar/bookings.
   */
  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    const best = NAV_ITEMS.filter(
      ({ href: h }) => h !== "/dashboard" && pathname.startsWith(h)
    ).sort((a, b) => b.href.length - a.href.length)[0];
    return best?.href === href;
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <div>
          <span className="font-heading text-base font-bold text-primary">MIXTRAN</span>
          <p className="text-xs text-text-muted leading-none">Administración</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="rounded-md p-2 text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
        >
          {open ? (
            /* X icon */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          ) : (
            /* Hamburger icon */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="6"  x2="20" y2="6"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
              <line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── Backdrop (mobile only) ──────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ──────────────────────────────────────────── */}
      <aside
        className={[
          /* Desktop: always visible, static in flow */
          "lg:relative lg:flex lg:w-56 lg:shrink-0 lg:translate-x-0 lg:flex-col lg:border-r lg:border-border lg:bg-surface",
          /* Mobile: fixed drawer that slides in/out */
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-surface",
          "transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Brand — desktop only (mobile has the top bar) */}
        <div className="hidden border-b border-border px-6 py-5 lg:block">
          <span className="font-heading text-lg font-bold text-primary">MIXTRAN</span>
          <p className="text-xs text-text-muted">Administración</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-l-2 border-primary bg-primary/5 text-primary"
                    : "border-l-2 border-transparent text-text-secondary hover:bg-background hover:text-text-primary",
                ].join(" ")}
              >
                {label}
              </a>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-border px-6 py-4">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
          >
            {loggingOut && <Spinner size="sm" />}
            {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      </aside>
    </>
  );
}
