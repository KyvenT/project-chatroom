import { css, useTheme, type Theme } from "@emotion/react";
import React from "react";

const styles = css({
    minHeight: "100%",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    form: {
        width: "97%",
        maxHeight: "75%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: 0,
        padding: "6px",
        borderRadius: "4px"
    },

    input: {
        width: "95%",
        maxHeight: "100%",
        backgroundColor: "inherit",
        border: 0, 
        outlineStyle: "none",
    },

    button: {
        width: "fit-content",
        fontSize: "1rem",
        borderRadius: "4px",
        padding: "4px",
        backgroundColor: "inherit",
        border: 0,
        transition: "background-color 0.1s ease",
    },

    'button:hover': {
        cursor: "pointer",

    }
});

const colors = (theme: Theme) => css({
    backgroundColor: theme.colors.light_grey,
    color: theme.colors.white,
    
    form: {
        backgroundColor: theme.colors.dark_grey,
    },

    input: {
        color: theme.colors.white
    },

    button: {
        color: theme.colors.white

    },

    'button:hover': {
        backgroundColor: theme.colors.light_grey,
        color: theme.colors.dark_grey
    }
});

interface MessageInputProps {
    handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    messageInputRef: React.RefObject<HTMLInputElement | null>;
}

const MessageInput = ({handleSubmit, messageInputRef}: MessageInputProps) => {
    const theme = useTheme();

    return (
        <div css={[styles, colors(theme)]}>
            <form onSubmit={(event) => handleSubmit(event)} id="message-form">
                <input ref={messageInputRef} type="text" placeholder="Message..." />
                <button type="submit" form="message-form">Send</button>
            </form>
        </div>
    );
}

export default MessageInput;