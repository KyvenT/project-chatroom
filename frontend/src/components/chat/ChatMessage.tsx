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
  borderRadius: "8px",
  backgroundClip: "padding-box",
  borderWidth: "1px", 
  borderStyle: "solid",
});

const colors = (theme: Theme) =>
  css({
    backgroundColor: "inherit",
    color: theme.colors.white,
    borderColor: theme.colors.black,

    "&:hover": {
      backgroundColor: theme.colors.dark_grey,
    },

    ".timeStamp": {
      color: theme.colors.grey,
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
        <strong>{sender}</strong>
        <span className="timeStamp">{timestamp.toLocaleString()}</span>
      </div>
      <p>{content}</p>
    </div>
  );
};

export default ChatMessage;
