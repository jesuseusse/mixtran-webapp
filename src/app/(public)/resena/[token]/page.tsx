import type { Metadata } from "next";
import * as reviewTokenService from "@/lib/services/reviewTokenService";
import { ReviewStepper } from "@/components/public/ReviewStepper";

/** Route segment params for /resena/[token]. */
interface Params {
  params: Promise<{ token: string }>;
}

/**
 * Metadata for the review submission page.
 * Marked noindex so search engines do not index ephemeral token URLs.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Deja tu Reseña | MIXTRAN",
    robots: { index: false, follow: false },
  };
}

// ─── Error screens ────────────────────────────────────────────────────────────

/** Shown when the token UUID is not found in DynamoDB. */
function NotFoundScreen() {
  return (
    <ErrorScreen
      title="Enlace no encontrado"
      message="Este enlace no existe o ya fue eliminado."
    />
  );
}

/** Shown when the token has already been used. */
function UsedScreen() {
  return (
    <ErrorScreen
      title="Enlace ya utilizado"
      message="Este enlace ya fue utilizado para enviar una reseña. Gracias por tu opinión."
    />
  );
}

/** Shown when the token has passed its 30-day expiry. */
function ExpiredScreen() {
  return (
    <ErrorScreen
      title="Enlace expirado"
      message="Este enlace ha expirado. Solicita uno nuevo al equipo de MIXTRAN."
    />
  );
}

/** Generic error layout shared by all error screens. */
function ErrorScreen({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-danger"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="font-heading text-xl font-bold text-text-primary">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
      </div>
    </main>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Public review submission page — /resena/[token].
 *
 * Server Component: validates the token directly via the service layer
 * (no HTTP round-trip). Renders the appropriate screen based on token state.
 */
export default async function ResenaTokenPage({ params }: Params) {
  const { token } = await params;

  let clientName: string;

  try {
    const view = await reviewTokenService.getTokenForClient(token);
    clientName = view.clientName;
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === "TOKEN_USED") return <UsedScreen />;
    if (msg === "TOKEN_EXPIRED") return <ExpiredScreen />;
    return <NotFoundScreen />;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-lg">
        {/* Logo / brand */}
        <p className="mb-8 text-center font-heading text-lg font-bold tracking-wide text-primary">
          MIXTRAN
        </p>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <ReviewStepper token={token} clientName={clientName} />
        </div>
      </div>
    </main>
  );
}
