import { css, type Theme } from "@emotion/react";

// Shared menu surface, with classes for the pieces most menus use
export const menuStyles = (theme: Theme) =>
  css({
    minWidth: "220px",
    padding: "6px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.popup,

    ".menuHeader": {
      padding: "8px 10px 10px",
      borderBottom: `1px solid ${theme.colors.border}`,
      marginBottom: "4px",
    },

    ".menuTitle": {
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: theme.colors.light_grey,
    },

    ".menuItem": {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      width: "100%",
      padding: "8px 10px",
      borderRadius: theme.radius.sm,
      fontSize: "0.9rem",
      textAlign: "left",
      textDecoration: "none",
      color: theme.colors.white,
      backgroundColor: "transparent",
      border: 0,
      cursor: "pointer",

      svg: {
        flex: "0 0 auto",
        color: theme.colors.light_grey,
      },

      "&:hover": {
        backgroundColor: theme.colors.grey,
      },

      "&:focus-visible": {
        outline: `2px solid ${theme.colors.accent}`,
        outlineOffset: "-2px",
      },
    },

    ".menuItemDanger": {
      color: theme.colors.danger,
      svg: { color: theme.colors.danger },
    },

    ".menuDivider": {
      height: "1px",
      margin: "4px 0",
      backgroundColor: theme.colors.border,
    },

    ".menuEmpty": {
      padding: "20px 10px",
      textAlign: "center",
      fontSize: "0.85rem",
      color: theme.colors.light_grey,
    },
  });
