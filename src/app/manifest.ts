import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reserva360",
    short_name: "R360",
    description: "Reserva360 — Sua Reserva. Nossa Solução.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f4f4f5",
    theme_color: "#f07316",
    icons: [
      { src: "/icon", sizes: "192x192", type: "image/png" },
      { src: "/icon", sizes: "512x512", type: "image/png" },
    ],
  };
}
