// Color palette matching theNext Shop brand (amber/cream/ink)
export const Colors = {
  // Brand colors
  ink: "#1a1a1a",
  cream: "#faf7f2",
  parchment: "#f0ebe0",
  amber: "#c9a84c",
  amberLight: "#d4b86a",
  amberDark: "#a8872e",

  // Semantic
  background: "#faf7f2",
  surface: "#f0ebe0",
  text: "#1a1a1a",
  textMuted: "rgba(26,26,26,0.5)",
  textLight: "rgba(26,26,26,0.35)",
  border: "rgba(26,26,26,0.1)",
  borderMed: "rgba(26,26,26,0.2)",

  // Status
  success: "#22c55e",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",

  // Dark theme (used in hero overlays)
  darkOverlay: "rgba(26,26,26,0.6)",
  darkOverlayLight: "rgba(26,26,26,0.3)",

  // White / transparent
  white: "#ffffff",
  transparent: "transparent",

  // Aliases for template compatibility
  light: {
    text: "#1a1a1a",
    background: "#faf7f2",
    tint: "#c9a84c",
    tabIconDefault: "rgba(26,26,26,0.35)",
    tabIconSelected: "#c9a84c",
  },
  dark: {
    text: "#faf7f2",
    background: "#1a1a1a",
    tint: "#c9a84c",
    tabIconDefault: "rgba(250,247,242,0.35)",
    tabIconSelected: "#c9a84c",
  },
};

export default Colors;

export const Typography = {
  display: "PlayfairDisplay_700Bold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemibold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};
