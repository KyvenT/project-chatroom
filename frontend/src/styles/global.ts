import { css } from "@emotion/react";
import type { AppTheme } from "./theme";

// Base page styles, for the app and for pop-out chat windows
export const globalStyles = (t: AppTheme) =>
  css({
    "*": {
      boxSizing: "border-box",
      margin: 0,
      scrollbarWidth: "thin",
      scrollbarColor: `${t.colors.borderStrong} transparent`,
      fontFamily:
        "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    },

    "*::before, *::after": {
      boxSizing: "border-box",
    },

    body: {
      backgroundColor: t.colors.black,
      color: t.colors.white,
      fontSize: "15px",
      lineHeight: 1.5,
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },

    a: {
      color: t.colors.accentHover,
      textDecoration: "none",
      "&:hover": { textDecoration: "underline" },
    },

    "input, textarea, select, button": {
      font: "inherit",
    },

    "button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible":
      {
        outline: `2px solid ${t.colors.accent}`,
        outlineOffset: "2px",
      },

    "::selection": {
      backgroundColor: t.colors.accentSoft,
    },
  });
