import { css, type Theme } from "@emotion/react";
import { mq } from "./breakpoints";

// the centered card the login, sign up and join pages are laid out in
export const authPageStyles = (theme: Theme) =>
  css(
    mq({
      width: ["90dvw", "420px"],
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "stretch",
      gap: "8px",
      padding: "32px",
      backgroundColor: theme.colors.dark_grey,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadow.popup,
      color: theme.colors.white,
      textAlign: "center",

      h1: {
        cursor: "default",
        fontSize: "1.5rem",
        fontWeight: 600,
        letterSpacing: "-0.02em",
      },

      ".authForm": {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: "12px 0 0",
        gap: "12px",

        ".textInput": {
          fontSize: "0.95rem",
          minWidth: 0,
          width: "100%",
          outline: "none",
          color: theme.colors.white,
          backgroundColor: theme.colors.black,
          "&::placeholder": {
            color: theme.colors.light_grey,
          },
        },

        ".passwordContainer, .usernameInput": {
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.black,
          transition: "border-color 0.15s ease",
        },

        ".passwordContainer": {
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 6px 0 0",
        },

        ".usernameInput": {
          padding: "10px 12px",
        },

        ".passwordInput": {
          flex: 1,
          border: 0,
          padding: "10px 12px",
          borderRadius: theme.radius.md,
        },

        ".passwordContainer:focus-within, .usernameInput:focus": {
          borderColor: theme.colors.accent,
        },

        ".submitBtn": {
          color: theme.colors.onAccent,
          cursor: "pointer",
          width: "100%",
          fontSize: "0.95rem",
          fontWeight: 500,
          padding: "10px 16px",
          backgroundColor: theme.colors.accent,
          border: 0,
          borderRadius: theme.radius.md,
          transition: "background-color 0.15s ease",
        },

        ".submitBtn:hover": {
          backgroundColor: theme.colors.accentHover,
        },

        ".revealPasswordBtn": {
          cursor: "pointer",
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          border: 0,
          color: theme.colors.light_grey,
        },

        ".revealPasswordBtn:hover": {
          color: theme.colors.white,
        },

        ".eyeIcon": {
          color: "inherit",
        },

        "> p": {
          color: theme.colors.danger,
          fontSize: "0.85rem",
        },

        "> span": {
          alignSelf: "center",
        },

        "> a": {
          fontSize: "0.85rem",
        },
      },
    }),
  );
