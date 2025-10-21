import { css, useTheme, type Theme } from "@emotion/react";

interface ChatMessageProps {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
}

const styles = css({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "auto",
  padding: "10px",
  borderRadius: "0 8px 8px 0",
  backgroundClip: "padding-box",

  strong: {
    fontWeight: "500",
  },

  ".content": {
    width: "100%",
    overflowWrap: "break-word",
  },
});

const colors = (theme: Theme) =>
  css({
    backgroundColor: "inherit",
    color: theme.colors.white,
    borderColor: "transparent",

    "&:hover": {
      backgroundColor: theme.colors.dark_grey,
    },

    ".timeStamp": {
      color: theme.colors.light_grey,
    },

    ".messageHeader": {
      display: "flex",
      gap: "4px",
    },
  });

const ChatMessage = ({ id, content, sender, timestamp }: ChatMessageProps) => {
  const theme = useTheme();

  return (
    <div key={id} css={[styles, colors(theme)]}>
      <div className="messageHeader">
        <p>
          <strong>{sender}</strong>
        </p>
        <span className="timeStamp">
          {`${timestamp.getFullYear()}/${timestamp.getMonth() + 1}/${timestamp.getDate()} ${timestamp.toLocaleString(
            "en-US",
            {
              timeStyle: "short",
              hour12: true,
            },
          )}`}
        </span>
      </div>
      <p className="content">{content}</p>
    </div>
  );
};

export default ChatMessage;
