import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mixtran Revestimientos — Asesoría de Color Premium",
    template: "%s | Mixtran Revestimientos",
  },
  description:
    "Consultoría de color experta y soluciones de pintura de alta calidad. Agenda tu cita de asesoría de color hoy.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mixtran",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/icons/icon-192.png",
  },
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
      <head>
        <meta name="theme-color" content="#0f1f3d" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />
      </head>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
