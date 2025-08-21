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
});

const colors = (theme: Theme) => css({
    backgroundColor: theme.colors.light_grey,
    color: theme.colors.dark_grey,
    borderBottom: `1px solid ${theme.colors.dark_grey}`,
});

const ChatMessage = ({id, content, sender, timestamp}: ChatMessageProps) => {
    const theme = useTheme();

    return (
        <div key={id} css={[styles, colors(theme)]}>
            <div>
                <strong>{sender}</strong> 
                <span>{new Intl.DateTimeFormat('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    }).format(timestamp)}
                </span>
            </div>
            <p>{content}</p>
        </div>
    );
}

export default ChatMessage;