// Legacy color keys are kept so existing components pick up the new palette:
//   black      -> app background
//   dark_grey  -> panels / raised surfaces
//   grey       -> hover / selected surfaces
//   light_grey -> muted text
//   white      -> primary text
export const theme = {
  colors: {
    black: "#0e1015",
    dark_grey: "#161922",
    grey: "#212634",
    light_grey: "#8f98aa",
    white: "#e9ebf1",

    border: "#262b39",
    borderStrong: "#363c4e",
    accent: "#6d72f6",
    accentHover: "#8085fa",
    accentSoft: "rgba(109, 114, 246, 0.14)",
    onAccent: "#ffffff",
    danger: "#ef5a5a",
    success: "#3ecf8e",
  },
  radius: {
    sm: "6px",
    md: "8px",
    lg: "12px",
  },
  shadow: {
    popup: "0 10px 30px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.03)",
    card: "0 1px 2px rgba(0, 0, 0, 0.3)",
  },
};

export type AppTheme = typeof theme;
