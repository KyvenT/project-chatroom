import { css, useTheme, type Theme } from "@emotion/react";
import { SendHorizonal } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { sendWSMessage } from "../../ws-router/ws";
import { COUNTDOWN_FROM, MAX_MESSAGE_LENGTH } from "../../utils/messageLimits";
import { AttachButton } from "./AttachButton";

const styles = css({
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "8px 24px 20px",

  form: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    padding: "8px 8px 8px 16px",
    borderRadius: "12px",
    transition: "border-color 0.15s ease",
  },

  textarea: {
    width: "95%",
    height: "fit-content",
    backgroundColor: "inherit",
    border: 0,
    outlineStyle: "none",
    fontSize: "0.95rem",
    lineHeight: 1.5,
    wordBreak: "break-all",
    resize: "none",
    padding: "4px 0",
  },

  ".sendBtn": {
    width: "2.25rem",
    height: "2.25rem",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    borderRadius: "8px",
    border: 0,
    transition: "background-color 0.15s ease",
  },

  ".sendBtn:hover": {
    cursor: "pointer",
  },

  ".charCount": {
    flex: "0 0 auto",
    fontSize: "0.75rem",
  },
});

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,
    color: theme.colors.white,

    form: {
      backgroundColor: theme.colors.dark_grey,
      border: `1px solid ${theme.colors.border}`,
    },

    "form:focus-within": {
      borderColor: theme.colors.accent,
    },

    textarea: {
      color: theme.colors.white,
    },

    ".sendBtn": {
      color: theme.colors.onAccent,
      backgroundColor: theme.colors.accent,
    },

    ".sendBtn:hover": {
      backgroundColor: theme.colors.accentHover,
    },

    "textarea::placeholder": {
      color: theme.colors.light_grey,
    },

    ".charCount": {
      color: theme.colors.light_grey,
    },
  });

interface MessageInputProps {
  handleSubmit: (event: React.FormEvent) => void;
  messageInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

const MessageInput = ({ handleSubmit, messageInputRef }: MessageInputProps) => {
  const theme = useTheme();
  const [height, setHeight] = useState(1);
  const { chatroomId } = useParams();
  const [hasTyped, setHasTyped] = useState<boolean>(false);
  const [length, setLength] = useState(0);
  const remaining = MAX_MESSAGE_LENGTH - length;

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!messageInputRef.current || !chatroomId) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (messageInputRef.current.value === "") return;
      handleSubmit(event);
      setHeight(1);
      setLength(0);
    } else if (event.key === "Enter" && event.shiftKey) {
      setHeight((prevHeight) => prevHeight + 1);
      //messageInputRef.current.value += "\n";
      messageInputRef.current.style.overflowY = "hidden";
    }

    if (!hasTyped) {
      setHasTyped(true);
      sendWSMessage({ type: "typing-presence", chatroomId });
    }
  };

  useEffect(() => {
    if (!hasTyped) return;

    const presenceTimeout = setTimeout(() => {
      setHasTyped(false);
    }, 1000);

    return () => {
      clearTimeout(presenceTimeout);
    };
  }, [hasTyped]);

  return (
    <div css={[styles, colors(theme)]}>
      <form
        onSubmit={(event) => {
          handleSubmit(event);
          setLength(0);
        }}
        id="message-form"
      >
        <textarea
          ref={messageInputRef}
          placeholder="Message..."
          rows={height}
          onKeyDown={handleKeyPress}
          onInput={(event) => setLength(event.currentTarget.value.length)}
          maxLength={MAX_MESSAGE_LENGTH}
          id="message"
          required
          autoFocus
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
        {chatroomId && <AttachButton chatroomId={chatroomId} />}
        <button
          type="submit"
          form="message-form"
          className="sendBtn"
          aria-label="Send message"
        >
          <SendHorizonal size="1.25rem" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
