import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mixtran Revestimientos — Asesoría de Color Premium",
    template: "%s | Mixtran Revestimientos",
  },
  description:
    "Consultoría de color experta y soluciones de pintura de alta calidad. Agenda tu cita de asesoría de color hoy.",
};

/**
 * Root layout shared by all routes.
 * Fonts and colors are set via CSS variables in globals.css.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
