import { css, useTheme, type Theme } from "@emotion/react";
import type { EmojiSuggestionsState } from "../../hooks/useEmojiAutocomplete";

const styles = (theme: Theme) =>
  css({
    position: "absolute",
    bottom: "calc(100% + 6px)",
    left: 0,
    right: 0,
    zIndex: 10,
    listStyle: "none",
    margin: 0,
    padding: "4px",
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.dark_grey,
    boxShadow: theme.shadow.popup,

    ".suggestionsTitle": {
      padding: "4px 8px",
      fontSize: "0.7rem",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      color: theme.colors.light_grey,
    },

    button: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "5px 8px",
      border: 0,
      borderRadius: theme.radius.sm,
      textAlign: "left",
      font: "inherit",
      fontSize: "0.85rem",
      color: theme.colors.white,
      backgroundColor: "transparent",
      cursor: "pointer",
    },

    "button.active": { backgroundColor: theme.colors.grey },

    ".suggestionEmoji": { fontSize: "1.2rem", lineHeight: 1 },

    ".suggestionCode": {
      color: theme.colors.light_grey,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  });

// Emojis matching the shortcode being typed in a message box, shown above it.
// Its parent needs `position: relative`.
export const EmojiSuggestions = ({
  matches,
  active,
  choose,
}: EmojiSuggestionsState) => {
  const theme = useTheme();
  if (matches.length === 0) return null;

  return (
    <ul css={styles(theme)} role="listbox" aria-label="Emoji suggestions">
      <li className="suggestionsTitle" aria-hidden>
        Emoji matching
      </li>
      {matches.map((match, index) => (
        <li key={match.id} role="option" aria-selected={index === active}>
          <button
            type="button"
            className={index === active ? "active" : undefined}
            tabIndex={-1}
            // keeps the cursor in the message box
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(index)}
          >
            <span className="suggestionEmoji">{match.native}</span>
            <span className="suggestionCode">:{match.id}:</span>
          </button>
        </li>
      ))}
    </ul>
  );
};
