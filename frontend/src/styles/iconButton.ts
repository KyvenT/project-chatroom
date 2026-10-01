import { css, type Theme } from "@emotion/react";

export const iconBtnStyles = (theme: Theme) =>
  css({
    border: 0,
    backgroundColor: "inherit",
    color: theme.colors.light_grey,
    display: "grid",
    placeItems: "center",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
    userSelect: "none",
    transition: "color 0.15s ease, background-color 0.15s ease",

    "&:hover": {
      color: theme.colors.white,
      backgroundColor: theme.colors.grey,
    },
  });
