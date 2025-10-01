import { css, useTheme, type Theme } from "@emotion/react";
import { SendHorizonal } from "lucide-react";
import React, { useEffect, useState } from "react";
import useWebSocketContext from "../../hooks/useWebSocketContext";
import { useParams } from "react-router";
import useToggle from "../../hooks/useToggle";

const styles = css({
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: "10px 0",

  form: {
    width: "97%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: 0,
    padding: "6px",
    borderRadius: "4px",
  },

  textarea: {
    width: "95%",
    height: "fit-content",
    backgroundColor: "inherit",
    border: 0,
    outlineStyle: "none",
    fontSize: "1rem",
    wordBreak: "break-all",
    resize: "none",
  },

  button: {
    width: "fit-content",
    height: "100%",
    fontSize: "1rem",
    borderRadius: "4px",
    padding: "4px",
    backgroundColor: "inherit",
    transition: "background-color 0.1s ease",
  },

  "button:hover": {
    cursor: "pointer",
  },
});

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,
    color: theme.colors.white,

    form: {
      backgroundColor: theme.colors.dark_grey,
    },

    textarea: {
      color: theme.colors.white,
    },

    button: {
      color: theme.colors.white,
      border: `1px solid ${theme.colors.dark_grey}`,
    },

    "button:hover": {
      backgroundColor: theme.colors.white,
      color: theme.colors.dark_grey,
      fontWeight: 500,
    },

    "textarea::placeholder": {
      color: theme.colors.light_grey,
    },
  });

interface MessageInputProps {
  handleSubmit: () => void;
  messageInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

const MessageInput = ({ handleSubmit, messageInputRef }: MessageInputProps) => {
  const theme = useTheme();
  const [height, setHeight] = useState(1);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!messageInputRef.current) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (messageInputRef.current.value === "") return;
      handleSubmit();
      setHeight(1);
    } else if (event.key === "Enter" && event.shiftKey) {
      setHeight((prevHeight) => prevHeight + 1);
      //messageInputRef.current.value += "\n";
      messageInputRef.current.style.overflowY = "hidden";
    }
    };

  return (
    <div css={[styles, colors(theme)]}>
      <form onSubmit={handleSubmit} id="message-form">
        <textarea
          ref={messageInputRef}
          placeholder="Message..."
          rows={height}
          onKeyDown={handleKeyPress}
          id="message"
          required
          autoFocus
        />
        <button type="submit" form="message-form" aria-label="Send message">
          <SendHorizonal size="1.25rem" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
