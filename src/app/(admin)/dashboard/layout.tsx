import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/verifySession";
import type { ReactNode } from "react";

/**
 * Dashboard layout — auth guard.
 *
 * Every page under /dashboard is a Server Component by default.
 * verifySession() is called here so all child pages are automatically protected.
 * Unauthenticated requests are redirected to /login.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await verifySession();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-surface">
        <div className="px-6 py-5 border-b border-border">
          <span className="font-heading text-lg font-bold text-primary">MIXTRAN</span>
          <p className="text-xs text-text-muted">Administración</p>
        </div>
        <nav className="py-4">
          <NavItem href="/dashboard" label="Resumen" />
          <NavItem href="/dashboard/calendar" label="Calendario" />
          <NavItem href="/dashboard/calendar/bookings" label="Reservas" />
          <NavItem href="/dashboard/contacts" label="Contactos" />
        </nav>
        <div className="absolute bottom-4 left-0 w-56 px-6">
          <LogoutButton />
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}

/** Single sidebar navigation link. */
function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center px-6 py-2.5 text-sm text-text-secondary hover:bg-background hover:text-text-primary transition-colors"
    >
      {label}
    </a>
  );
}

/** Client-side logout button — must be a separate client component. */
function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="w-full rounded-md border border-border px-3 py-2 text-xs text-text-muted hover:border-danger hover:text-danger transition-colors"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
