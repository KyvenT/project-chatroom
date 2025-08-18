import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessage from "./ChatMessage";
import { useQuery } from "@tanstack/react-query";
import useAuthContext from "../hooks/useAuthContext";
import type { Message } from "../types/Message";
import { useCustomQuery } from "../hooks/useCustomQuery";

interface ChatMessageProps {
    chatroomId: string;
}

const styles = css({
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.light_grey,
    color: theme.colors.white,
});

const ChatMessages = ({chatroomId}: ChatMessageProps) => {
    const theme = useTheme();
    const {user, isLoggedIn} = useAuthContext();
    const getBefore = new Date();
    const { data } = useCustomQuery<Message>(
        ["messages", chatroomId, isLoggedIn ? user.userId : "not logged in"],
        "message",
        chatroomId,
        getBefore);
    console.log("messages: " + data);

    return (
        <div css={[styles, colors(theme)]}>
            {data && data.map((message) => {
                return (
                    <ChatMessage 
                        key={message.id}
                        content={message.content}
                        sender={message.senderUser?.username || message.senderGuest?.username || "Unnamed User"}
                        timestamp={new Date(message.createdAt)}/>
                )
            })}
        </div>
    );
}

export default ChatMessages;