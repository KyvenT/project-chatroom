import { css } from "@emotion/react";

// The toolbar shows on hover or keyboard focus of an element with this class
// (always on touch screens, which can't hover)
export const messageHostStyles = css({
  position: "relative",

  ".messageToolbar": {
    opacity: 0,
    pointerEvents: "none",
  },

  "&:hover .messageToolbar, &:focus-within .messageToolbar": {
    opacity: 1,
    pointerEvents: "auto",
  },

  "@media (hover: none)": {
    ".messageToolbar": { opacity: 1, pointerEvents: "auto" },
  },
});
