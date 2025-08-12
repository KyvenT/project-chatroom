import { css, useTheme, type Theme } from "@emotion/react";
import useAuthContext from "../hooks/useAuthContext";
import useWebSocketContext from "../hooks/useWebSocketContext";
import { useRef } from "react";
import { useParams } from "react-router";

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
        alignItems: "center",
        border: 0,
        padding: "6px",
        borderRadius: "4px"
    },

    input: {
        width: "95%",
        padding: "8px 16px",
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
        border: 0
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

const MessageInput = () => {
    const theme = useTheme();
    const {isLoggedIn} = useAuthContext();
    const {ws} = useWebSocketContext();
    const messageInput = useRef<HTMLInputElement>(null);
    const {chatroomId} = useParams();
    
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!isLoggedIn || !messageInput.current || !chatroomId) return;

        ws?.send(JSON.stringify({
            type: "message", 
            content: messageInput.current.value,
            chatroomId,
        }));
    };

    return (
        <div css={[styles, colors(theme)]}>
            <form onSubmit={handleSubmit} id="message-form">
                <input ref={messageInput} type="text" placeholder="Message..." />
                <button type="submit" form="message-form">Send</button>
            </form>
        </div>
    );
}

export default MessageInput;