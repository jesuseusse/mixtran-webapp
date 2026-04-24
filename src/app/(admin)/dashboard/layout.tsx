import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/verifySession";
import { DashboardSidebar } from "@/components/admin/DashboardSidebar";
import type { ReactNode } from "react";

/**
 * Dashboard layout — auth guard.
 *
 * Every page under /dashboard is a Server Component by default.
 * verifySession() is called here so all child pages are automatically protected.
 * Unauthenticated requests are redirected to /login.
 *
 * Layout structure:
 * - Mobile: DashboardSidebar renders a top bar + slide-in drawer.
 * - Desktop (lg+): DashboardSidebar renders a static side column; main content
 *   sits alongside it in a flex row.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await verifySession();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto p-6 lg:ml-56 lg:p-8">{children}</main>
    </div>
  );
}
