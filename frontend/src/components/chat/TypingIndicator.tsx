import { css, useTheme, type Theme } from "@emotion/react";
import { useTypingUsers } from "../../hooks/useStores";

const styles = (theme: Theme) =>
  css({
    minHeight: "1.25rem",
    fontSize: "0.8rem",
    fontStyle: "italic",
    color: theme.colors.light_grey,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });

const describe = (names: string[]) => {
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  if (names.length === 3) {
    return `${names[0]}, ${names[1]} and ${names[2]} are typing…`;
  }
  return "Several people are typing…";
};

// "alice is typing…" for a chatroom; keeps its height while empty so the
// layout doesn't jump
export const TypingIndicator = ({
  chatroomId,
  className,
}: {
  chatroomId: string | undefined;
  className?: string;
}) => {
  const theme = useTheme();
  const names = useTypingUsers(chatroomId).map((t) => t.username);

  return (
    <p css={styles(theme)} className={className} aria-live="polite">
      {names.length > 0 ? describe(names) : ""}
    </p>
  );
};
