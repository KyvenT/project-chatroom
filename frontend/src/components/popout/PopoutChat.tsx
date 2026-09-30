import { css, useTheme, type Theme } from "@emotion/react";
import { AppWindow, ChevronUp, Maximize2, Minus, X } from "lucide-react";
import { useNavigate } from "react-router";
import { usePopoutStore, type Popout } from "../../hooks/usePopoutStore";
import { useChatroomsStore } from "../../hooks/useStores";
import Button from "../Button";
import { PopoutChatBody } from "./PopoutChatBody";
import { isChatWindowSupported, openChatWindow } from "./chatWindow";

const styles = (theme: Theme) =>
  css({
    width: "min(320px, calc(100vw - 32px))",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    color: theme.colors.white,
    backgroundColor: theme.colors.dark_grey,
    border: `1px solid ${theme.colors.borderStrong}`,
    borderBottom: 0,
    borderRadius: `${theme.radius.lg} ${theme.radius.lg} 0 0`,
    boxShadow: theme.shadow.popup,

    "&.expanded": {
      height: "min(420px, calc(100dvh - 96px))",
    },

    ".popoutHeader": {
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      gap: "2px",
      padding: "6px 6px 6px 12px",
      borderBottom: `1px solid ${theme.colors.border}`,
    },

    "&:not(.expanded) .popoutHeader": {
      borderBottom: 0,
    },

    ".popoutTitle": {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "4px 0",
      border: 0,
      background: "none",
      color: "inherit",
      font: "inherit",
      fontSize: "0.9rem",
      fontWeight: 600,
      textAlign: "left",
      cursor: "pointer",

      span: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },

      "&:focus-visible": {
        outline: `2px solid ${theme.colors.accent}`,
        outlineOffset: "2px",
        borderRadius: theme.radius.sm,
      },
    },

    ".unreadBadge": {
      flex: "0 0 auto",
      minWidth: "1.25rem",
      height: "1.25rem",
      padding: "0 6px",
      borderRadius: "999px",
      fontSize: "0.7rem",
      lineHeight: "1.25rem",
      textAlign: "center",
      color: theme.colors.onAccent,
      backgroundColor: theme.colors.accent,
    },

    // no padding and a fixed icon size, so the icon sits centered
    ".headerBtn": {
      flex: "0 0 auto",
      width: "1.75rem",
      height: "1.75rem",
      padding: 0,

      svg: { width: "1rem", height: "1rem" },
    },
  });

export const PopoutChat = ({ popout }: { popout: Popout }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { chatroomId, minimized } = popout;
  const close = usePopoutStore((state) => state.close);
  const setMinimized = usePopoutStore((state) => state.setMinimized);
  const chatroom = useChatroomsStore((state) =>
    state.chatrooms.find((c) => c.chatroomId === chatroomId),
  );

  const title = chatroom?.chatroom.title ?? "Chat";
  const unread = chatroom?.unreadMessages ?? 0;

  return (
    <section
      css={styles(theme)}
      className={minimized ? undefined : "expanded"}
      aria-label={`${title} chat`}
    >
      <div className="popoutHeader">
        <button
          type="button"
          className="popoutTitle"
          aria-expanded={!minimized}
          onClick={() => setMinimized(chatroomId, !minimized)}
          title={minimized ? "Expand" : "Minimize"}
        >
          <span>{title}</span>
          {minimized && unread > 0 && (
            <span className="unreadBadge" aria-label={`${unread} unread`}>
              {unread}
            </span>
          )}
        </button>
        <Button
          variant="icon"
          className="headerBtn"
          aria-label={minimized ? `Expand ${title}` : `Minimize ${title}`}
          onClick={() => setMinimized(chatroomId, !minimized)}
        >
          {minimized ? <ChevronUp /> : <Minus />}
        </Button>
        {isChatWindowSupported() && (
          <Button
            variant="icon"
            className="headerBtn"
            aria-label={`Pop ${title} out to a window`}
            title="Pop out to a window on top of other apps"
            onClick={() => openChatWindow(chatroomId)}
          >
            <AppWindow />
          </Button>
        )}
        <Button
          variant="icon"
          className="headerBtn"
          aria-label={`Open ${title} in full`}
          title="Open in full"
          onClick={() => {
            navigate(`/chat/${chatroomId}`);
            close(chatroomId);
          }}
        >
          <Maximize2 />
        </Button>
        <Button
          variant="icon"
          className="headerBtn"
          aria-label={`Close ${title} pop-out`}
          onClick={() => close(chatroomId)}
        >
          <X />
        </Button>
      </div>

      {!minimized && <PopoutChatBody chatroomId={chatroomId} />}
    </section>
  );
};
