"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Admin login page — /login.
 *
 * POSTs credentials to /api/auth/login which sets an httpOnly session cookie.
 * On success redirects to /dashboard.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (json.success) {
        router.push("/dashboard");
      } else {
        setError(json.error ?? "Credenciales incorrectas");
        setLoading(false)
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false)
    }  
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <span className="font-heading text-3xl font-bold text-primary">MIXTRAN</span>
          <p className="mt-1 text-sm text-text-muted">Panel de administración</p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="rounded-lg border border-border bg-surface p-8 shadow-card space-y-5"
        >
          <h1 className="font-heading text-xl font-bold text-text-primary">Iniciar sesión</h1>

          <Input
            label="Correo electrónico"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-button transition-colors hover:bg-primary-dark disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {loading && <Spinner size="sm" />}
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
