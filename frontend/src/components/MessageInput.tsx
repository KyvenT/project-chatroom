import { css, useTheme, type Theme } from "@emotion/react";

const styles = css({
    minHeight: "100%",
    width: "100%",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",

    form: {
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
    },

    input: {
        width: "95%",
    },

    button: {
        
    },
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.light_grey,
    color: theme.colors.white,
});

const MessageInput = () => {
    const theme = useTheme();

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        // Handle message submission logic here
    };

    return (
        <div css={[styles, colors(theme)]}>
            <form onSubmit={handleSubmit} id="message-form">
                <input type="text" placeholder="Message chat #1" />
            </form>
            <button type="submit" form="message-form">Send</button>
        </div>
    );
}

export default MessageInput;