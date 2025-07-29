import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessage from "./ChatMessage";

const styles = css({
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
});

const ChatMessages = () => {
    const theme = useTheme();

    return (
        <div css={[styles, colors(theme)]}>
            <ChatMessage
                content="Hello, how are you?"
                sender="User1"
                timestamp={new Date()}
            />
            <ChatMessage
                content="I'm good, thanks! How about you?"
                sender="User2"
                timestamp={new Date()}
            />
            <ChatMessage
                content="Doing well, just working on this chat app!"
                sender="User1"
                timestamp={new Date()}
            />
        </div>
    );
}

export default ChatMessages;