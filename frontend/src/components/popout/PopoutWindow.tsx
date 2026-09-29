import createCache from "@emotion/cache";
import {
  CacheProvider,
  css,
  Global,
  useTheme,
  type Theme,
} from "@emotion/react";
import { ArrowDownToLine, Maximize2, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { usePopoutStore } from "../../hooks/usePopoutStore";
import { useChatroomsStore } from "../../hooks/useStores";
import { globalStyles } from "../../styles/global";
import Button from "../Button";
import { PopoutChatBody } from "./PopoutChatBody";

const styles = (theme: Theme) =>
  css({
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    color: theme.colors.white,
    backgroundColor: theme.colors.dark_grey,

    ".windowHeader": {
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      gap: "2px",
      padding: "6px 6px 6px 8px",
      borderBottom: `1px solid ${theme.colors.border}`,
    },

    ".tabs": {
      flex: 1,
      minWidth: 0,
      display: "flex",
      gap: "2px",
      overflowX: "auto",
      scrollbarWidth: "none",
    },

    ".tab": {
      flex: "0 1 auto",
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      borderRadius: theme.radius.sm,
      color: theme.colors.light_grey,

      "&.active": {
        color: theme.colors.white,
        backgroundColor: theme.colors.grey,
      },

      "&:hover": { color: theme.colors.white },
    },

    ".tabButton": {
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: "6px",
      padding: "5px 4px 5px 8px",
      border: 0,
      background: "none",
      color: "inherit",
      font: "inherit",
      fontSize: "0.85rem",
      fontWeight: 600,
      cursor: "pointer",

      span: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    },

    ".tab:only-child .tabButton": {
      cursor: "default",
      fontSize: "0.9rem",
    },

    ".unreadBadge": {
      flex: "0 0 auto",
      minWidth: "1.1rem",
      height: "1.1rem",
      padding: "0 5px",
      borderRadius: "999px",
      fontSize: "0.65rem",
      lineHeight: "1.1rem",
      textAlign: "center",
      color: theme.colors.onAccent,
      backgroundColor: theme.colors.accent,
    },

    ".tabClose": {
      flex: "0 0 auto",
      width: "1.4rem",
      height: "1.4rem",
      marginRight: "2px",
      padding: "4px",
    },

    ".headerBtn": {
      flex: "0 0 auto",
      width: "1.75rem",
      height: "1.75rem",
      padding: "5px",
    },
  });

const WindowTab = ({
  chatroomId,
  active,
  onlyTab,
}: {
  chatroomId: string;
  active: boolean;
  onlyTab: boolean;
}) => {
  const chatroom = useChatroomsStore((state) =>
    state.chatrooms.find((c) => c.chatroomId === chatroomId),
  );
  const setActive = usePopoutStore((state) => state.setActiveWindowTab);
  const closeTab = usePopoutStore((state) => state.closeWindowTab);
  const title = chatroom?.chatroom.title ?? "Chat";
  const unread = chatroom?.unreadMessages ?? 0;

  return (
    <div className={active ? "tab active" : "tab"}>
      <button
        type="button"
        className="tabButton"
        role="tab"
        aria-selected={active}
        onClick={() => setActive(chatroomId)}
      >
        <span>{title}</span>
        {!active && unread > 0 && (
          <span className="unreadBadge" aria-label={`${unread} unread`}>
            {unread}
          </span>
        )}
      </button>
      {!onlyTab && (
        <Button
          variant="icon"
          className="tabClose"
          aria-label={`Close ${title}`}
          onClick={() => closeTab(chatroomId)}
        >
          <X />
        </Button>
      )}
    </div>
  );
};

const ChatWindowContent = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const windowTabs = usePopoutStore((state) => state.windowTabs);
  const activeTab = usePopoutStore((state) => state.activeWindowTab);
  const closeTab = usePopoutStore((state) => state.closeWindowTab);
  const open = usePopoutStore((state) => state.open);

  // chatrooms the user has left drop out of the window
  const memberOf = new Set(chatrooms.map((c) => c.chatroomId));
  const tabs = windowTabs.filter((id) => memberOf.has(id));
  const active = activeTab && memberOf.has(activeTab) ? activeTab : tabs[0];
  const title =
    chatrooms.find((c) => c.chatroomId === active)?.chatroom.title ?? "Chat";

  useEffect(() => {
    // (wait for the chatroom list, rather than closing everything)
    if (chatrooms.length === 0) return;
    windowTabs.filter((id) => !memberOf.has(id)).forEach((id) => closeTab(id));
  });

  if (!active) return null;

  return (
    <div css={styles(theme)}>
      <div className="windowHeader">
        <div className="tabs" role="tablist" aria-label="Chats">
          {tabs.map((id) => (
            <WindowTab
              key={id}
              chatroomId={id}
              active={id === active}
              onlyTab={tabs.length === 1}
            />
          ))}
        </div>
        <Button
          variant="icon"
          className="headerBtn"
          aria-label={`Move ${title} back to the page`}
          title="Back to the page"
          onClick={() => open(active)}
        >
          <ArrowDownToLine />
        </Button>
        <Button
          variant="icon"
          className="headerBtn"
          aria-label={`Open ${title} in full`}
          title="Open in full"
          onClick={() => {
            navigate(`/chat/${active}`);
            closeTab(active);
            window.focus();
          }}
        >
          <Maximize2 />
        </Button>
        {tabs.length === 1 && (
          <Button
            variant="icon"
            className="headerBtn"
            aria-label={`Close ${title}`}
            onClick={() => closeTab(active)}
          >
            <X />
          </Button>
        )}
      </div>
      <PopoutChatBody key={active} chatroomId={active} autoFocus />
    </div>
  );
};

// Renders the chats in the picture-in-picture window, if one is open. It's
// part of this React app, so it shares its state, theme and connection.
export const PopoutWindow = () => {
  const theme = useTheme();
  const chatWindow = usePopoutStore((state) => state.chatWindow);

  // styles for the window go into its own document
  const cache = useMemo(
    () =>
      chatWindow &&
      createCache({ key: "chat-window", container: chatWindow.document.head }),
    [chatWindow],
  );

  // the window's chats go away with the page (e.g. signing out)
  useEffect(() => () => usePopoutStore.getState().chatWindow?.close(), []);

  if (!chatWindow || !cache) return null;

  return createPortal(
    <CacheProvider value={cache}>
      <Global styles={globalStyles(theme)} />
      <ChatWindowContent />
    </CacheProvider>,
    chatWindow.document.body,
  );
};
