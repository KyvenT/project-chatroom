import { css, useTheme, type Theme } from "@emotion/react";
import { SmilePlus } from "lucide-react";
import { useState } from "react";
import { useMembersStore } from "../../hooks/useStores";
import type { useReactions } from "../../hooks/useReactions";
import type { Reaction } from "../../types/REST-types/Message";
import { shortcodeForEmoji } from "../../utils/emoji";

const styles = (theme: Theme) =>
  css({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "4px",
    marginTop: "4px",

    button: {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      height: "1.6rem",
      padding: "0 7px",
      font: "inherit",
      fontSize: "0.8rem",
      color: theme.colors.light_grey,
      backgroundColor: theme.colors.dark_grey,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: "999px",
      cursor: "pointer",

      "&:hover": { borderColor: theme.colors.borderStrong },
      "&:focus-visible": { outline: `2px solid ${theme.colors.accent}` },
      "&:disabled": { cursor: "progress" },
    },

    ".reactionEmoji": { fontSize: "0.95rem", lineHeight: 1 },

    "button.mine": {
      color: theme.colors.white,
      backgroundColor: theme.colors.accentSoft,
      borderColor: theme.colors.accent,
    },

    // shows with the toolbar, on hover or focus
    ".addReaction": {
      opacity: 0,
      transition: "opacity 0.1s ease",
    },

    "&.compact button": { height: "1.4rem", fontSize: "0.72rem" },

    ".reactionError": {
      fontSize: "0.72rem",
      color: theme.colors.danger,
    },
  });

// the emojis on a message, in the order they were first used, with who used
// each
const groupReactions = (reactions: Reaction[]) => {
  const groups = new Map<string, string[]>();
  for (const { emoji, userId } of reactions) {
    groups.set(emoji, [...(groups.get(emoji) ?? []), userId]);
  }
  return [...groups].map(([emoji, userIds]) => ({ emoji, userIds }));
};

interface MessageReactionsProps {
  reactions: Reaction[];
  reacting: ReturnType<typeof useReactions>;
  canReact: boolean;
  compact?: boolean;
}

// The emojis people reacted to a message with, and how many used each.
// Clicking one adds or takes back your own.
export const MessageReactions = ({
  reactions,
  reacting,
  canReact,
  compact = false,
}: MessageReactionsProps) => {
  const theme = useTheme();
  const members = useMembersStore((state) => state.members);
  const { userId, isMine, toggle, pending, error, openPicker } = reacting;
  // each emoji's shortcode, looked up once the reactions are hovered
  const [shortcodes, setShortcodes] = useState<Record<string, string>>({});

  if (reactions.length === 0 && !error) return null;

  const groups = groupReactions(reactions);

  // emoji data is only downloaded when it's needed, so not until here
  const loadShortcodes = async () => {
    const missing = groups
      .map(({ emoji }) => emoji)
      .filter((emoji) => !(emoji in shortcodes));
    if (missing.length === 0) return;
    try {
      const found = await Promise.all(missing.map(shortcodeForEmoji));
      setShortcodes((known) => ({
        ...known,
        ...Object.fromEntries(
          missing.map((emoji, i) => [emoji, found[i] ?? emoji]),
        ),
      }));
    } catch {
      // the tooltip keeps the emoji itself
    }
  };

  // names are only known for the open chatroom's members
  const nameOf = (id: string) =>
    id === userId
      ? "you"
      : (members.find((m) => m.memberId === id)?.member.username ?? null);

  const describe = (label: string, userIds: string[]) => {
    const names = userIds.map(nameOf);
    const known = names.filter((name): name is string => !!name);
    const others = names.length - known.length;
    const who = [
      ...known,
      ...(others > 0 ? [`${others} ${others === 1 ? "other" : "others"}`] : []),
    ].join(", ");
    return `${label} reacted by ${who}`;
  };

  return (
    <div
      className={compact ? "compact" : undefined}
      css={styles(theme)}
      // on the row, since disabled chips don't get mouse events
      onMouseEnter={loadShortcodes}
      onFocus={loadShortcodes}
    >
      {groups.map(({ emoji, userIds }) => (
        <button
          key={emoji}
          type="button"
          className={isMine(emoji) ? "mine" : undefined}
          aria-pressed={isMine(emoji)}
          aria-label={describe(emoji, userIds)}
          title={describe(shortcodes[emoji] ?? emoji, userIds)}
          disabled={!canReact || pending}
          onClick={() => toggle(emoji)}
        >
          <span className="reactionEmoji">{emoji}</span>
          {userIds.length}
        </button>
      ))}
      {canReact && reactions.length > 0 && (
        <button
          type="button"
          className="addReaction"
          aria-label="Add a reaction"
          onClick={(event) => openPicker(event.currentTarget)}
        >
          <SmilePlus size="0.9rem" />
        </button>
      )}
      {error && (
        <span className="reactionError" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
