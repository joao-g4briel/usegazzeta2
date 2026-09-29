import type { MetadataRoute } from "next";

// PWA: painel, PDV e scanner instaláveis na tela inicial do celular.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/pdv",
    name: "Use Gazzeta",
    short_name: "Gazzeta",
    description: "PDV, scanner e painel da Use Gazzeta.",
    start_url: "/pdv",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#87977C",
    background_color: "#F7F3EB",
    lang: "pt-BR",
    categories: ["business", "shopping"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Escanear produto", short_name: "Scanner", url: "/pdv/scanner" },
      { name: "Nova venda", short_name: "PDV", url: "/pdv" },
      { name: "Painel", short_name: "Painel", url: "/admin/dashboard" },
    ],
  };
}
