import { css, useTheme, type Theme } from "@emotion/react";

const styles = css({
    minHeight: "100%",
    width: "100%",
    display: "flex",
    borderRadius: "10px",

    input: {
        width: "80%",
    },

    button: {
        justifySelf: "flex-end",
    },
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.light_grey,
    color: theme.colors.white,
});

const MessageInput = () => {
    const theme = useTheme();

    return (
        <div css={[styles, colors(theme)]}>
            <input type="text" placeholder="Type your message here..." />
            <button type="submit">Send</button>
        </div>
    );
}

export default MessageInput;