import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessage from "./ChatMessage";
import useAuthContext from "../hooks/useAuthContext";
import type { Message } from "../types/Message";
import { useCustomQuery } from "../hooks/useCustomQuery";
import { useEffect, useMemo, useState } from "react";
import useWebSocketContext from "../hooks/useWebSocketContext";
import { useParams } from "react-router";

const styles = css({
    minHeight: "100%",
    display: "flex",
    flexDirection: "column-reverse",
    overflowY: "auto",
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.light_grey,
    color: theme.colors.white,
});

const ChatMessages = () => {
    const theme = useTheme();
    const {user, isLoggedIn} = useAuthContext();
    const {chatroomId} = useParams();
    if (!chatroomId) {
        console.error("Chatroom ID is not defined");
        return null;
    }
    const getBefore = useMemo(() => new Date(), [chatroomId]);
    const { data, refetch } = useCustomQuery<Message>(
        [chatroomId, isLoggedIn ? user.userId : "", getBefore.toISOString()],
        "message", { chatroomId, getBefore, queryOptions: { enabled: false } });
    const {wsEventQueues, clearMessageQueue} = useWebSocketContext();
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        if (data) {
            setMessages(data);
        } else {
            refetch();
        }
    }, [data]);

    useEffect(() => {
        const wsMessages = wsEventQueues.messageQueue.filter(
            (msg) => msg.chatroomId === chatroomId
        )
        console.log(wsEventQueues.messageQueue.forEach(m => console.log(m)));
        console.log("wsMessages: ", wsMessages);
        if (wsMessages.length === 0) {
            console.log("No new ws messages");
            return;
        };
        setMessages((prevMessages) => [...wsMessages, ...prevMessages]);
        clearMessageQueue();
    }, [wsEventQueues.messageQueue]);

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