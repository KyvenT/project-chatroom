import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessage from "./ChatMessage";
import useAuthContext from "../hooks/useAuthContext";
import type { Message } from "../types/Message";
import { useCustomQuery } from "../hooks/useCustomQuery";
import type { ChatLayoutContext } from "../router/routes/chat/ChatLayout";
import { useOutletContext } from "react-router";
import { useEffect, useMemo, useState } from "react";
import useWebSocketContext from "../hooks/useWebSocketContext";

interface ChatMessageProps {
    chatroomId: string;
}

const styles = css({
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
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
        "message", { chatroomId, getBefore, queryOptions: { refetchOnMount: false } });
    const {wsEventQueues, setWsEventQueues, clearMessageQueue} = useWebSocketContext();
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        const wsMessages = wsEventQueues.messageQueue
        console.log(wsEventQueues.messageQueue.forEach(m => console.log(m)));
        console.log("wsMessages: ", wsMessages);
        if (wsMessages.length === 0) {
            if (data && messages.length === 0) {
                setMessages(data);
            }
            console.log("No new ws messages");
            return;
        };
        setMessages((prevMessages) => [...prevMessages, ...wsMessages]);
        clearMessageQueue();
    }, [data, wsEventQueues]);

    return (
        <div css={[styles, colors(theme)]}>
            {messages && messages.map((message) => {
                return (
                    <ChatMessage 
                        key={message.id}
                        id={message.id}
                        content={message.content}
                        sender={message.senderUser?.username || "Unnamed User"}
                        timestamp={new Date(message.createdAt)}/>
                )
            })}
        </div>
    );
}

export default ChatMessages;