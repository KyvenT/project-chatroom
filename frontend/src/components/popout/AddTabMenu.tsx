import { css, useTheme, type Theme } from "@emotion/react";
import { Plus } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePopoutStore } from "../../hooks/usePopoutStore";
import { useChatroomsStore } from "../../hooks/useStores";
import { iconBtnStyles } from "../../styles/iconButton";
import { menuStyles } from "../../styles/menu";

// how wide (px) the menu is, if the window has room
const MENU_WIDTH = 260;
// space (px) kept between the menu and the window's edges
const EDGE = 8;

const styles = (theme: Theme) =>
  css({
    position: "fixed",
    zIndex: 100,
    maxHeight: "min(360px, calc(100vh - 60px))",
    minWidth: 0,

    input: {
      width: "100%",
      padding: "6px 8px",
      marginBottom: "4px",
      font: "inherit",
      fontSize: "0.85rem",
      color: theme.colors.white,
      backgroundColor: theme.colors.black,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.radius.sm,
      outline: "none",

      "&:focus": { borderColor: theme.colors.accent },
      "&::placeholder": { color: theme.colors.light_grey },
    },

    ".chatList": {
      minHeight: 0,
      listStyle: "none",
      margin: 0,
      padding: 0,
      overflowY: "auto",
    },

    ".menuItem": { fontSize: "0.85rem", padding: "6px 8px" },

    ".menuItem.highlighted": { backgroundColor: theme.colors.grey },

    ".chatTitle": {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    ".unreadBadge": { marginLeft: "auto" },

    ".menuEmpty": { padding: "12px 8px" },
  });

// A + button after the chat window's tabs, choosing another chatroom to open
// in a new tab without going back to the page
export const AddTabMenu = () => {
  const theme = useTheme();
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const windowTabs = usePopoutStore((state) => state.windowTabs);
  const openInWindow = usePopoutStore((state) => state.openInWindow);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const choices = chatrooms
    .filter((c) => !windowTabs.includes(c.chatroomId))
    .filter((c) =>
      c.chatroom.title.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => a.chatroomIndex - b.chatroomIndex);

  const close = () => {
    setOpen(false);
    setQuery("");
    setHighlighted(0);
  };

  const choose = (chatroomId: string) => {
    openInWindow(chatroomId);
    close();
  };

  // under the button, kept inside the window
  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!open || !button) return;
    const win = button.ownerDocument.defaultView ?? window;
    const rect = button.getBoundingClientRect();
    const width = Math.min(MENU_WIDTH, win.innerWidth - 2 * EDGE);
    setPosition({
      top: rect.bottom + 4,
      left: Math.max(EDGE, Math.min(rect.left, win.innerWidth - width - EDGE)),
      width,
    });
  }, [open]);

  // the window has its own document, so clicks outside are watched there
  useEffect(() => {
    const doc = buttonRef.current?.ownerDocument;
    if (!open || !doc) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      close();
    };
    doc.addEventListener("mousedown", onMouseDown);
    return () => doc.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        setHighlighted((i) => Math.min(i + 1, choices.length - 1));
        break;
      case "ArrowUp":
        setHighlighted((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (choices[highlighted]) choose(choices[highlighted].chatroomId);
        break;
      case "Escape":
        close();
        buttonRef.current?.focus();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        css={iconBtnStyles(theme)}
        className="headerBtn addTab"
        aria-label="Open another chat"
        title="Open another chat"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Plus />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="dialog"
          aria-label="Open another chat"
          css={[menuStyles(theme), styles(theme)]}
          style={position}
          onKeyDown={onKeyDown}
        >
          <input
            type="search"
            value={query}
            placeholder="Find a chat"
            aria-label="Find a chat"
            autoFocus
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlighted(0);
            }}
          />
          {choices.length === 0 ? (
            <p className="menuEmpty">
              {query.trim()
                ? "No chats match"
                : "All your chats are open already"}
            </p>
          ) : (
            <ul className="chatList">
              {choices.map((chatroom, index) => (
                <li key={chatroom.chatroomId}>
                  <button
                    type="button"
                    className={
                      index === highlighted
                        ? "menuItem highlighted"
                        : "menuItem"
                    }
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => choose(chatroom.chatroomId)}
                  >
                    <span className="chatTitle">{chatroom.chatroom.title}</span>
                    {chatroom.unreadMessages > 0 && (
                      <span
                        className="unreadBadge"
                        aria-label={`${chatroom.unreadMessages} unread`}
                      >
                        {chatroom.unreadMessages}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
};
