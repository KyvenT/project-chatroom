import { css } from "@emotion/react";

// The toolbar (and add reaction button) shows on hover or keyboard focus of
// an element with this class, or while its emoji picker is open (always on
// touch screens, which can't hover)
export const messageHostStyles = css({
  position: "relative",

  ".messageToolbar": {
    opacity: 0,
    pointerEvents: "none",
  },

  "&:hover .messageToolbar, &:focus-within .messageToolbar, &.reacting .messageToolbar":
    {
      opacity: 1,
      pointerEvents: "auto",
    },

  "&:hover .addReaction, &:focus-within .addReaction, &.reacting .addReaction":
    { opacity: 1 },

  "@media (hover: none)": {
    ".messageToolbar": { opacity: 1, pointerEvents: "auto" },
    ".addReaction": { opacity: 1 },
  },
});
