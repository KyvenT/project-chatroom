import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, RotateCcw, TriangleAlert } from "lucide-react";
import { mq } from "../../../styles/breakpoints";
import {
  colorSettings,
  defaultColors,
  isHexColor,
  type EditableColor,
} from "../../../styles/theme";
import { useThemeStore } from "../../../hooks/useThemeStore";
import {
  MAX_MESSAGE_CHAIN_MINUTES,
  usePreferencesStore,
} from "../../../hooks/usePreferencesStore";
import { useAuthStore } from "../../../hooks/useStores";
import { fieldStyles, modalButtonStyles } from "../../../styles/modalForm";
import { ConfirmModal } from "../../../components/ConfirmModal";
import Button from "../../../components/Button";
import { contrastRatio } from "../../../utils/contrast";

// the page scrolls itself, since the chat layout around it doesn't
const scrollAreaStyles = css({
  height: "100%",
  overflowY: "auto",
});

const styles = (theme: Theme) =>
  css(
    modalButtonStyles(theme),
    mq({
      maxWidth: "1040px",
      margin: "0 auto",
      padding: ["16px", "24px", "32px 24px"],
      color: theme.colors.white,

      ".backLink": {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "0.9rem",
        color: theme.colors.light_grey,
        "&:hover": { color: theme.colors.white, textDecoration: "none" },
      },

      ".pageHeader": {
        margin: "16px 0 24px",
        h1: { fontSize: "1.75rem", fontWeight: 600 },
        p: { color: theme.colors.light_grey },
      },

      ".layout": {
        display: "grid",
        gridTemplateColumns: ["1fr", "1fr", "1fr", "minmax(0, 1fr) 340px"],
        gap: "24px",
        alignItems: "start",
      },

      ".card": {
        backgroundColor: theme.colors.black,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
      },

      ".cardHeader": {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "16px 20px",
        borderBottom: `1px solid ${theme.colors.border}`,

        h2: { fontSize: "1.05rem", fontWeight: 600 },
        p: { fontSize: "0.85rem", color: theme.colors.light_grey },
      },

      ".group": {
        padding: "16px 20px 8px",
        "& + .group": { borderTop: `1px solid ${theme.colors.border}` },
      },

      ".groupLabel": {
        marginBottom: "4px",
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: theme.colors.light_grey,
      },

      ".mainColumn": {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        minWidth: 0,
      },

      ".previewColumn": {
        position: ["static", "static", "static", "sticky"],
        top: "24px",
      },
    }),
  );

const rowStyles = (theme: Theme) =>
  css(
    mq({
      display: "grid",
      gridTemplateColumns: ["auto 1fr auto", "auto 1fr 110px 2rem"],
      gridTemplateAreas: [
        `"swatch text reset" "swatch hex hex"`,
        `"swatch text hex reset"`,
      ],
      alignItems: "center",
      columnGap: "12px",
      rowGap: "6px",
      padding: "10px 0",

      ".swatch": {
        gridArea: "swatch",
        width: "2.5rem",
        height: "2.5rem",
        padding: 0,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: theme.radius.sm,
        backgroundColor: "transparent",
        cursor: "pointer",
        overflow: "hidden",

        "&::-webkit-color-swatch-wrapper": { padding: 0 },
        "&::-webkit-color-swatch": { border: 0 },
        "&::-moz-color-swatch": { border: 0 },
        "&:focus-visible": {
          outline: `2px solid ${theme.colors.accent}`,
          outlineOffset: "2px",
        },
      },

      ".rowText": {
        gridArea: "text",
        minWidth: 0,
        label: { display: "block", fontSize: "0.9rem", fontWeight: 500 },
      },

      ".rowDescription": {
        fontSize: "0.8rem",
        color: theme.colors.light_grey,
      },

      ".hex": {
        gridArea: "hex",
        width: "100%",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "0.85rem",
        textTransform: "lowercase",
      },

      ".hex[aria-invalid='true']": {
        borderColor: theme.colors.danger,
      },

      ".reset": {
        gridArea: "reset",
        width: "2rem",
        height: "2rem",
        padding: "7px",
      },

      ".warning": {
        gridColumn: "2 / -1",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "0.8rem",
        color: theme.colors.statusAway,
      },
    }),
  );

// WCAG AA minimums: body text, and short button labels / UI parts
const TEXT_CONTRAST = 4.5;
const BUTTON_CONTRAST = 3;

// Pairs that need to stay readable, listed under each color that affects them
type ContrastCheck = {
  fg: EditableColor;
  bg: EditableColor;
  against: string;
  min: number;
};

const contrastChecks: Partial<Record<EditableColor, ContrastCheck[]>> = {
  white: [
    { fg: "white", bg: "black", against: "Background", min: TEXT_CONTRAST },
    { fg: "white", bg: "dark_grey", against: "Panels", min: TEXT_CONTRAST },
  ],
  light_grey: [
    {
      fg: "light_grey",
      bg: "black",
      against: "Background",
      min: TEXT_CONTRAST,
    },
  ],
  black: [{ fg: "white", bg: "black", against: "Text", min: TEXT_CONTRAST }],
  dark_grey: [
    { fg: "white", bg: "dark_grey", against: "Text", min: TEXT_CONTRAST },
  ],
  onAccent: [
    { fg: "onAccent", bg: "accent", against: "Accent", min: BUTTON_CONTRAST },
  ],
  accent: [
    {
      fg: "onAccent",
      bg: "accent",
      against: "Text on accent",
      min: BUTTON_CONTRAST,
    },
  ],
};

const ColorRow = ({
  colorKey,
  label,
  description,
}: {
  colorKey: EditableColor;
  label: string;
  description: string;
}) => {
  const theme = useTheme();
  const value = theme.colors[colorKey];
  const isCustom = useThemeStore((state) => colorKey in state.overrides);
  const setColor = useThemeStore((state) => state.setColor);
  const resetColor = useThemeStore((state) => state.resetColor);
  const [hexDraft, setHexDraft] = useState(value);

  // keep the text field in step with the picker and resets
  useEffect(() => setHexDraft(value), [value]);

  const inputId = `color-${colorKey}`;
  const hexInvalid = !isHexColor(hexDraft);

  const lowContrast = (contrastChecks[colorKey] ?? [])
    .map(({ fg, bg, against, min }) => ({
      against,
      min,
      ratio: contrastRatio(theme.colors[fg], theme.colors[bg]),
    }))
    .filter(({ ratio, min }) => ratio < min);

  return (
    <div css={rowStyles(theme)}>
      <input
        id={inputId}
        className="swatch"
        type="color"
        value={value}
        onChange={(e) => setColor(colorKey, e.target.value)}
        aria-describedby={`${inputId}-description`}
      />
      <div className="rowText">
        <label htmlFor={inputId}>{label}</label>
        <span className="rowDescription" id={`${inputId}-description`}>
          {description}
        </span>
      </div>
      <input
        className="hex"
        css={fieldStyles(theme)}
        value={hexDraft}
        onChange={(e) => {
          setHexDraft(e.target.value);
          setColor(colorKey, e.target.value);
        }}
        onBlur={() => setHexDraft(value)}
        maxLength={7}
        spellCheck={false}
        aria-label={`${label} hex value`}
        aria-invalid={hexInvalid}
      />
      {isCustom ? (
        <Button
          variant="icon"
          type="button"
          className="reset"
          aria-label={`Reset ${label} to default (${defaultColors[colorKey]})`}
          title="Reset to default"
          onClick={() => resetColor(colorKey)}
        >
          <RotateCcw />
        </Button>
      ) : (
        <span className="reset" aria-hidden="true" />
      )}
      {lowContrast.map(({ against, ratio, min }) => (
        <p key={against} className="warning">
          <TriangleAlert size="0.9rem" aria-hidden="true" />
          Hard to read against {against} ({ratio.toFixed(1)}:1, aim for {min}
          :1)
        </p>
      ))}
    </div>
  );
};

const previewStyles = (theme: Theme) =>
  css({
    overflow: "hidden",

    ".previewBody": {
      display: "grid",
      gridTemplateColumns: "120px 1fr",
      minHeight: "260px",
    },

    ".previewSidebar": {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
      padding: "10px 8px",
      backgroundColor: theme.colors.dark_grey,
      borderRight: `1px solid ${theme.colors.border}`,
      fontSize: "0.8rem",
    },

    ".previewLabel": {
      padding: "4px 6px",
      fontSize: "0.65rem",
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: theme.colors.light_grey,
    },

    ".previewRow": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "5px 6px",
      borderRadius: theme.radius.sm,
      color: theme.colors.light_grey,
    },

    ".previewRow.active": {
      backgroundColor: theme.colors.accentSoft,
      color: theme.colors.white,
      fontWeight: 600,
    },

    ".previewRow.hover": {
      backgroundColor: theme.colors.grey,
    },

    ".previewBadge": {
      minWidth: "1.1rem",
      padding: "0 5px",
      borderRadius: "999px",
      fontSize: "0.65rem",
      fontWeight: 600,
      textAlign: "center",
      color: theme.colors.onAccent,
      backgroundColor: theme.colors.accent,
    },

    ".previewChat": {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      padding: "12px",
      backgroundColor: theme.colors.black,
      fontSize: "0.85rem",
    },

    ".previewMessage strong": { fontWeight: 600 },

    ".previewTime": {
      marginLeft: "6px",
      fontSize: "0.7rem",
      color: theme.colors.light_grey,
    },

    ".previewStatuses": {
      display: "flex",
      gap: "10px",
      fontSize: "0.75rem",
      color: theme.colors.light_grey,
      span: { display: "flex", alignItems: "center", gap: "4px" },
    },

    ".dot": {
      width: "0.6rem",
      height: "0.6rem",
      borderRadius: "50%",
    },

    ".previewButtons": {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginTop: "auto",
      ".btn": { padding: "5px 10px", fontSize: "0.75rem" },
    },

    ".previewFeedback": {
      display: "flex",
      gap: "6px",
      fontSize: "0.75rem",
    },

    ".badge": {
      padding: "1px 7px",
      borderRadius: "999px",
      fontWeight: 600,
    },
  });

const Preview = () => {
  const theme = useTheme();

  return (
    <div className="card" css={previewStyles(theme)} aria-hidden="true">
      <div className="cardHeader">
        <div>
          <h2>Preview</h2>
          <p>Changes apply across the site as you pick them.</p>
        </div>
      </div>
      <div className="previewBody">
        <div className="previewSidebar">
          <span className="previewLabel">Chats</span>
          <span className="previewRow active">General</span>
          <span className="previewRow hover">
            Design <span className="previewBadge">3</span>
          </span>
          <span className="previewRow">Book club</span>
        </div>
        <div className="previewChat">
          <p className="previewMessage">
            <strong>alice</strong>
            <span className="previewTime">2:30 PM</span>
            <br />
            Does this colour work?
          </p>
          <div className="previewStatuses">
            <span>
              <i
                className="dot"
                style={{ background: theme.colors.statusOnline }}
              />
              Online
            </span>
            <span>
              <i
                className="dot"
                style={{ background: theme.colors.statusAway }}
              />
              Away
            </span>
            <span>
              <i
                className="dot"
                style={{ background: theme.colors.statusOffline }}
              />
              Offline
            </span>
          </div>
          <div className="previewFeedback">
            <span
              className="badge"
              style={{
                color: theme.colors.success,
                background: theme.colors.successSoft,
              }}
            >
              Accepted
            </span>
            <span
              className="badge"
              style={{
                color: theme.colors.danger,
                background: theme.colors.dangerSoft,
              }}
            >
              Declined
            </span>
          </div>
          <div className="previewButtons" css={modalButtonStyles(theme)}>
            <span className="btn btnPrimary">Save</span>
            <span className="btn btnSecondary">Cancel</span>
            <span className="btn btnDanger">Delete</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const switchStyles = (theme: Theme) =>
  css({
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    padding: "16px 20px",

    label: { display: "block", fontSize: "0.9rem", fontWeight: 500 },
    p: { fontSize: "0.8rem", color: theme.colors.light_grey },

    ".switch": {
      flex: "0 0 auto",
      position: "relative",
      width: "2.5rem",
      height: "1.4rem",
      padding: 0,
      border: 0,
      borderRadius: "999px",
      backgroundColor: theme.colors.borderStrong,
      cursor: "pointer",
      transition: "background-color 0.15s ease",

      "&::after": {
        content: '""',
        position: "absolute",
        top: "3px",
        left: "3px",
        width: "calc(1.4rem - 6px)",
        height: "calc(1.4rem - 6px)",
        borderRadius: "50%",
        backgroundColor: theme.colors.white,
        transition: "transform 0.15s ease",
      },

      "&[aria-checked='true']": {
        backgroundColor: theme.colors.accent,
        "&::after": {
          backgroundColor: theme.colors.onAccent,
          transform: "translateX(1.1rem)",
        },
      },

      "&:focus-visible": {
        outline: `2px solid ${theme.colors.accent}`,
        outlineOffset: "2px",
      },

      "&:disabled": {
        opacity: 0.5,
        cursor: "not-allowed",
      },
    },
  });

const HomePageSettings = () => {
  const theme = useTheme();
  const isGuest = useAuthStore((state) => state.user.isGuest);
  const synced = usePreferencesStore((state) => state.syncFoldersWithHome);
  const setPreference = usePreferencesStore((state) => state.setPreference);

  return (
    <section className="card" aria-labelledby="homeHeading">
      <div className="cardHeader">
        <div>
          <h2 id="homeHeading">Home page</h2>
          <p>Choose what the home page groups show.</p>
        </div>
      </div>
      <div css={switchStyles(theme)}>
        <div>
          <label id="syncFoldersLabel" htmlFor="syncFolders">
            Sync sidebar folders with home page groups
          </label>
          <p id="syncFoldersDescription">
            {isGuest
              ? "Sign up for an account to use folders."
              : "The home page shows your sidebar folders and their chatrooms instead of pinned groups. Changes on either page apply to both. Your pinned groups are kept and come back when this is off."}
          </p>
        </div>
        <button
          id="syncFolders"
          type="button"
          role="switch"
          className="switch"
          aria-checked={synced && !isGuest}
          aria-labelledby="syncFoldersLabel"
          aria-describedby="syncFoldersDescription"
          disabled={isGuest}
          onClick={() => setPreference("syncFoldersWithHome", !synced)}
        />
      </div>
    </section>
  );
};

const minutesInputStyles = (theme: Theme) =>
  css({
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "0.85rem",
    color: theme.colors.light_grey,

    input: {
      width: "4.5rem",
      padding: "6px 8px",
      font: "inherit",
      color: theme.colors.white,
      backgroundColor: theme.colors.black,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.radius.sm,

      "&:focus-visible": {
        outline: "none",
        borderColor: theme.colors.accent,
      },
      "&[aria-invalid='true']": { borderColor: theme.colors.danger },
    },
  });

const ChatSettings = () => {
  const theme = useTheme();
  const minutes = usePreferencesStore((state) => state.messageChainMinutes);
  const setPreference = usePreferencesStore((state) => state.setPreference);
  // what's typed, which may be briefly empty or out of range
  const [draft, setDraft] = useState(String(minutes));

  const parsed = Number(draft);
  const valid =
    draft.trim() !== "" &&
    Number.isInteger(parsed) &&
    parsed >= 0 &&
    parsed <= MAX_MESSAGE_CHAIN_MINUTES;

  return (
    <section className="card" aria-labelledby="chatHeading">
      <div className="cardHeader">
        <div>
          <h2 id="chatHeading">Chat</h2>
          <p>Choose how messages are shown.</p>
        </div>
      </div>
      <div css={switchStyles(theme)}>
        <div>
          <label htmlFor="chainMinutes">
            Group messages from the same person
          </label>
          <p id="chainMinutesDescription">
            A message sent within this many minutes of the same person's
            previous message is shown under it, without their name again. Set it
            to 0 to show every name. (0–{MAX_MESSAGE_CHAIN_MINUTES})
          </p>
        </div>
        <div css={minutesInputStyles(theme)}>
          <input
            id="chainMinutes"
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_MESSAGE_CHAIN_MINUTES}
            step={1}
            value={draft}
            aria-describedby="chainMinutesDescription"
            aria-invalid={!valid}
            onChange={(e) => {
              setDraft(e.target.value);
              const value = Number(e.target.value);
              if (
                e.target.value.trim() !== "" &&
                Number.isInteger(value) &&
                value >= 0 &&
                value <= MAX_MESSAGE_CHAIN_MINUTES
              ) {
                setPreference("messageChainMinutes", value);
              }
            }}
            // a number that can't be used goes back to the saved one
            onBlur={() => !valid && setDraft(String(minutes))}
          />
          <span>minutes</span>
        </div>
      </div>
    </section>
  );
};

export const SettingsPage = () => {
  const theme = useTheme();
  const hasCustomColors = useThemeStore(
    (state) => Object.keys(state.overrides).length > 0,
  );
  const resetAll = useThemeStore((state) => state.resetAll);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  return (
    <div css={scrollAreaStyles}>
      <div css={styles(theme)}>
        <Link to="/chat" className="backLink">
          <ArrowLeft size="1rem" /> Back to chat
        </Link>
        <div className="pageHeader">
          <h1>Settings</h1>
          <p>Colors are saved in this browser.</p>
        </div>

        <div className="layout">
          <div className="mainColumn">
            <HomePageSettings />
            <ChatSettings />
            <section className="card" aria-labelledby="colorsHeading">
              <div className="cardHeader">
                <div>
                  <h2 id="colorsHeading">Colors</h2>
                  <p>Pick a color for each part of the site.</p>
                </div>
                <button
                  type="button"
                  className="btn btnSecondary"
                  disabled={!hasCustomColors}
                  onClick={() => setConfirmResetOpen(true)}
                >
                  Reset all
                </button>
              </div>
              {colorSettings.map(({ group, colors }) => (
                <div className="group" key={group}>
                  <h3 className="groupLabel">{group}</h3>
                  {colors.map(({ key, label, description }) => (
                    <ColorRow
                      key={key}
                      colorKey={key}
                      label={label}
                      description={description}
                    />
                  ))}
                </div>
              ))}
            </section>
          </div>

          <div className="previewColumn">
            <Preview />
          </div>
        </div>

        {confirmResetOpen && (
          <ConfirmModal
            open={confirmResetOpen}
            title="Reset all colors?"
            confirmLabel="Reset colors"
            onConfirm={() => {
              resetAll();
              setConfirmResetOpen(false);
            }}
            onCancel={() => setConfirmResetOpen(false)}
          >
            Every color goes back to the default theme.
          </ConfirmModal>
        )}
      </div>
    </div>
  );
};
