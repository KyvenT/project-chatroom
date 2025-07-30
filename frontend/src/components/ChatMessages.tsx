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
                content="lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
                sender="User1"
                timestamp={new Date()}
            />
        </div>
    );
}

export default ChatMessages;