export type DashboardSurface =
  | "home"
  | "current"
  | "roadmap"
  | "guides"
  | "profile"
  | "analytics"
  | "franchise"
  | "marketing";

export const SURFACE_HREFS = {
  home: "/(tabs)/home",
  current: "/(tabs)/current",
  roadmap: "/(tabs)/roadmap",
  guides: "/(tabs)/guides",
  profile: "/(tabs)/profile",
  analytics: "/analytics",
  franchise: "/franchise",
  marketing: "/marketing"
} as const satisfies Record<DashboardSurface, string>;
