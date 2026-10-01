import { css, type Theme } from "@emotion/react";
import { mq } from "./breakpoints";

// Shared look for every modal: a header, a body of labeled fields or lists
// and a footer of actions, laid out with the classes below. Apply them all
// with formModalStyles.

export const fieldStyles = (theme: Theme) =>
  css({
    fontSize: "0.9rem",
    padding: "8px 10px",
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.black,
    color: theme.colors.white,
    border: `1px solid ${theme.colors.borderStrong}`,
    transition: "border-color 0.15s ease",

    "&:hover": {
      borderColor: theme.colors.light_grey,
    },

    "&:focus-visible": {
      outline: "none",
      borderColor: theme.colors.accent,
      boxShadow: `0 0 0 3px ${theme.colors.accentSoft}`,
    },

    "&::placeholder": {
      color: theme.colors.light_grey,
    },
  });

// a chevron for select boxes, drawn in the given color
const chevron = (color: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>`,
  )}")`;

// A select box that looks like the text fields, with its own arrow
export const selectStyles = (theme: Theme) =>
  css(fieldStyles(theme), {
    appearance: "none",
    cursor: "pointer",
    paddingRight: "36px",
    backgroundImage: chevron(theme.colors.light_grey),
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 10px center",
    backgroundSize: "16px",

    "&:hover": { backgroundImage: chevron(theme.colors.white) },

    option: {
      backgroundColor: theme.colors.dark_grey,
      color: theme.colors.white,
    },
  });

export const modalButtonStyles = (theme: Theme) =>
  css({
    ".btn": {
      fontSize: "0.9rem",
      fontWeight: 500,
      padding: "8px 14px",
      borderRadius: theme.radius.sm,
      border: "1px solid transparent",
      cursor: "pointer",
      transition: "background-color 0.15s ease, border-color 0.15s ease",

      "&:focus-visible": {
        outline: `2px solid ${theme.colors.accent}`,
        outlineOffset: "2px",
      },

      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    },

    ".btnPrimary": {
      backgroundColor: theme.colors.accent,
      color: theme.colors.onAccent,
      "&:hover:enabled": { backgroundColor: theme.colors.accentHover },
    },

    ".btnSecondary": {
      backgroundColor: "transparent",
      color: theme.colors.white,
      borderColor: theme.colors.borderStrong,
      "&:hover:enabled": { backgroundColor: theme.colors.grey },
    },

    ".btnDanger": {
      backgroundColor: "transparent",
      color: theme.colors.danger,
      borderColor: theme.colors.borderStrong,
      "&:hover:enabled": {
        backgroundColor: theme.colors.dangerSoft,
        borderColor: theme.colors.danger,
      },
    },

    ".btnDangerSolid": {
      backgroundColor: theme.colors.danger,
      color: theme.colors.onAccent,
      "&:hover:enabled": { backgroundColor: theme.colors.dangerHover },
    },
  });

export const modalSectionStyles = (theme: Theme) =>
  css({
    ".header": {
      padding: "24px 56px 20px 24px",
      borderBottom: `1px solid ${theme.colors.border}`,

      h2: {
        fontSize: "1.35rem",
        fontWeight: 600,
      },
    },

    ".eyebrow": {
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: theme.colors.light_grey,
      marginBottom: "6px",
    },

    ".subtitle": {
      marginTop: "6px",
      fontSize: "0.85rem",
      color: theme.colors.light_grey,
    },

    ".body": {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      padding: "20px 24px",
    },

    ".field": {
      display: "flex",
      flexDirection: "column",
      gap: "6px",

      label: {
        fontSize: "0.85rem",
        fontWeight: 500,
      },

      select: {
        cursor: "pointer",
        option: { backgroundColor: theme.colors.dark_grey },
      },
    },

    ".hint": {
      fontSize: "0.8rem",
      color: theme.colors.light_grey,
    },

    ".errorText": {
      fontSize: "0.8rem",
      color: theme.colors.danger,
    },

    ".footer": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "8px",
      padding: "16px 24px",
      borderTop: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.black,
    },

    ".footerEnd": {
      display: "flex",
      gap: "8px",
      marginLeft: "auto",
    },

    ".sectionLabel": {
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: theme.colors.light_grey,
    },

    ".list": {
      listStyle: "none",
      margin: 0,
      padding: "4px",
      maxHeight: "200px",
      overflowY: "auto",
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.black,
      scrollbarColor: `${theme.colors.borderStrong} transparent`,
    },

    ".listRow": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      width: "100%",
      padding: "8px 10px",
      borderRadius: theme.radius.sm,
      fontSize: "0.9rem",
      textAlign: "left",
      color: theme.colors.white,
      backgroundColor: "transparent",
      border: 0,
    },

    "button.listRow": {
      cursor: "pointer",
      "&:hover": { backgroundColor: theme.colors.grey },
      "&:focus-visible": {
        outline: `2px solid ${theme.colors.accent}`,
        outlineOffset: "-2px",
      },
    },

    ".listRowAction": {
      flex: "0 0 auto",
      fontSize: "0.8rem",
      color: theme.colors.light_grey,
    },

    "button.listRow:hover .listRowAction": {
      color: theme.colors.white,
    },

    ".listEmpty": {
      padding: "16px 10px",
      fontSize: "0.85rem",
      textAlign: "center",
      color: theme.colors.light_grey,
    },

    ".badge": {
      flex: "0 0 auto",
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      padding: "2px 8px",
      borderRadius: "999px",
      color: theme.colors.light_grey,
      backgroundColor: theme.colors.grey,
    },

    ".badgeSuccess": {
      color: theme.colors.success,
      backgroundColor: theme.colors.successSoft,
    },

    ".badgeDanger": {
      color: theme.colors.danger,
      backgroundColor: theme.colors.dangerSoft,
    },
  });

// Everything a modal needs; pass the desktop width, extra styles go after.
export const formModalStyles = (theme: Theme, desktopWidth = "440px") =>
  css(
    mq({
      width: ["90%", "70%", desktopWidth],
      maxHeight: "90dvh",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
    }),
    modalSectionStyles(theme),
    modalButtonStyles(theme),
  );
