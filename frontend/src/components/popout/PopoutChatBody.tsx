import { css, useTheme, type Theme } from "@emotion/react";
import { SendHorizonal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePopoutStore } from "../../hooks/usePopoutStore";
import { useChatroomsStore } from "../../hooks/useStores";
import { COUNTDOWN_FROM, MAX_MESSAGE_LENGTH } from "../../utils/messageLimits";
import { sendWSMessage } from "../../ws-router/ws";
import { MessageHistoryList } from "../chat/MessageHistoryList";
import { TypingIndicator } from "../chat/TypingIndicator";

// how often (ms) typing tells others you're typing
const TYPING_INTERVAL = 1000;

const styles = (theme: Theme) =>
  css({
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",

    ".popoutTyping": {
      flex: "0 0 auto",
      padding: "2px 12px",
      fontSize: "0.75rem",
      backgroundColor: theme.colors.black,
    },

    ".popoutInput": {
      flex: "0 0 auto",
      display: "flex",
      alignItems: "flex-end",
      gap: "6px",
      padding: "8px",
      borderTop: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.dark_grey,
    },

    textarea: {
      flex: 1,
      minWidth: 0,
      maxHeight: "5.5rem",
      resize: "none",
      padding: "7px 10px",
      fontSize: "0.85rem",
      lineHeight: 1.4,
      color: theme.colors.white,
      backgroundColor: theme.colors.black,
      border: `1px solid ${theme.colors.borderStrong}`,
      borderRadius: theme.radius.md,

      "&::placeholder": { color: theme.colors.light_grey },
      "&:focus-visible": {
        outline: "none",
        borderColor: theme.colors.accent,
      },
    },

    ".sendBtn": {
      flex: "0 0 auto",
      width: "2.1rem",
      height: "2.1rem",
      display: "grid",
      placeItems: "center",
      border: 0,
      borderRadius: theme.radius.md,
      color: theme.colors.onAccent,
      backgroundColor: theme.colors.accent,
      cursor: "pointer",

      "&:hover:enabled": { backgroundColor: theme.colors.accentHover },
      "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
    },

    ".charCount": {
      alignSelf: "center",
      fontSize: "0.7rem",
      color: theme.colors.light_grey,
    },
  });

// A chatroom's messages and a box to send more. While it's showing, the
// chatroom counts as read.
export const PopoutChatBody = ({
  chatroomId,
  autoFocus = false,
}: {
  chatroomId: string;
  autoFocus?: boolean;
}) => {
  const theme = useTheme();
  const liveMessages = usePopoutStore(
    (state) => state.liveMessages[chatroomId],
  );
  const title = useChatroomsStore(
    (state) =>
      state.chatrooms.find((c) => c.chatroomId === chatroomId)?.chatroom
        .title ?? "chat",
  );
  const updateUnread = useChatroomsStore((state) => state.updateChatroomUnread);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingSent = useRef(0);

  useEffect(() => {
    sendWSMessage({ type: "update-last-viewed-at", chatroomId });
    updateUnread(0, chatroomId);
  }, [chatroomId, liveMessages?.length, updateUnread]);

  // grow the message box with its text, up to its max height
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [draft]);

  const send = () => {
    const content = draft.trim();
    if (!content) return;
    sendWSMessage({ type: "message", content, chatroomId });
    setDraft("");
  };

  const remaining = MAX_MESSAGE_LENGTH - draft.length;

  return (
    <div css={styles(theme)}>
      <MessageHistoryList
        chatroomId={chatroomId}
        firstPageSize={15}
        pageSize={15}
        liveMessages={liveMessages}
      />
      <TypingIndicator chatroomId={chatroomId} className="popoutTyping" />
      <form
        className="popoutInput"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={`Message ${title}`}
          aria-label={`Message ${title}`}
          autoFocus={autoFocus}
          onChange={(e) => {
            setDraft(e.target.value);
            // like the main chat box, let others see you're typing
            const now = Date.now();
            if (
              e.target.value &&
              now - lastTypingSent.current > TYPING_INTERVAL
            ) {
              lastTypingSent.current = now;
              sendWSMessage({ type: "typing-presence", chatroomId });
            }
          }}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter adds a line
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        {remaining <= COUNTDOWN_FROM && (
          <span
            className="charCount"
            aria-live="polite"
            aria-label={`${remaining} characters left`}
          >
            {remaining}
          </span>
        )}
        <button
          type="submit"
          className="sendBtn"
          aria-label="Send message"
          disabled={!draft.trim()}
        >
          <SendHorizonal size="1rem" />
        </button>
      </form>
    </div>
  );
};
