export const colors = {
  background: "#f7f6f3",
  backgroundAlt: "#fbfaf7",
  text: "#111111",
  textStrong: "#0f172a",
  muted: "#5b616e",
  mutedSoft: "rgba(91,97,110,0.72)",
  border: "rgba(17,17,17,0.08)",
  borderStrong: "rgba(29,53,87,0.16)",
  surface: "rgba(255,255,255,0.82)",
  surfaceSoft: "rgba(255,255,255,0.64)",
  surfaceStrong: "#ffffff",
  primary: "#1d3557",
  primaryTop: "#1d2b7a",
  primaryBottom: "#0d0d4d",
  midnight: "#191970",
  aurora1: "#1d3557",
  aurora2: "#457b9d",
  aurora3: "#a8dadc",
  aurora4: "#e0f0ff",
  success: "#2d6a4f",
  warning: "#c58b2a",
  danger: "#b64c4c",
  white: "#ffffff"
} as const;

export const radii = {
  xs: 8,
  sm: 12,
  md: 14,
  lg: 18,
  xl: 22,
  card: 28,
  hero: 34,
  pill: 999
} as const;

export const spacing = {
  screenX: 20,
  screenTop: 18,
  screenBottom: 116,
  card: 20,
  cardLarge: 24,
  gap: 12,
  gapLarge: 16
} as const;

export const typography = {
  title: {
    fontSize: 32,
    lineHeight: 35,
    fontWeight: "700" as const,
    letterSpacing: -1.1
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700" as const,
    letterSpacing: -0.4
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "400" as const
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700" as const,
    letterSpacing: 1.3
  }
} as const;

export const shadows = {
  glassCard: {
    shadowColor: "#101820",
    shadowOpacity: 0.055,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4
  },
  floatingNav: {
    shadowColor: "#101820",
    shadowOpacity: 0.1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14
  },
  primaryButton: {
    shadowColor: colors.midnight,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5
  }
} as const;

export const motion = {
  pressScale: 0.98,
  durationFast: 160,
  duration: 260,
  durationSlow: 450
} as const;
