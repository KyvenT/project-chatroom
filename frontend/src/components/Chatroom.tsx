import { css, useTheme, type Theme } from "@emotion/react";
import Header from "./Header";
import ChatMessages from "./ChatMessages";
import MessageInput from "./MessageInput";

const styles = css({
    minHeight: "100%",
    flexGrow: 1,
    display: "grid",
    gridTemplateRows: "10% 85% 5%",
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.brown,
    color: theme.colors.dark_grey,
});

const Chatroom = () => {
    const theme = useTheme();

    return (
        <div css={[styles, colors(theme)]}>
            <Header />
            <ChatMessages />
            <MessageInput />
        </div>
    );
}

export default Chatroom;