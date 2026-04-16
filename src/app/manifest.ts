import type { MetadataRoute } from "next";

/**
 * Web App Manifest — served at /manifest.webmanifest by Next.js.
 * Enables "Add to Home Screen" / PWA installation on Chrome, Safari, Edge.
 * start_url points to /dashboard so admins land directly in the control panel.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mixtran Revestimientos — Admin",
    short_name: "Mixtran",
    description: "Panel de administración de Mixtran Revestimientos",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#0f1f3d",
    background_color: "#f5f5f0",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
