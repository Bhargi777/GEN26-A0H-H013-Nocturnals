import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ourAmrita",
    short_name: "ourAmrita",
    description: "Campus services, rooms, events and canteen.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EBEEF7",
    theme_color: "#A9244A",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/amrita.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/amrita-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/amrita-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/amrita-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Book a room", url: "/rooms", icons: [{ src: "/icons/amrita-192.png", sizes: "192x192" }] },
      { name: "Canteen", url: "/canteen", icons: [{ src: "/icons/amrita-192.png", sizes: "192x192" }] },
      { name: "Notifications", url: "/notifications", icons: [{ src: "/icons/amrita-192.png", sizes: "192x192" }] },
    ],
  };
}
