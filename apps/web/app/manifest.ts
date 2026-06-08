import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Found.One — 창업 로드맵 멘토링",
    short_name: "Found.One",
    description: "예비 창업자를 위한 AI 올인원 창업 멘토링 — 로드맵·매출·세무·자금·입지.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#191970",
    lang: "ko",
    icons: [
      { src: "/found-one-appicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/found-one-appicon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
