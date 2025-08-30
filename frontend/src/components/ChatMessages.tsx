import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessage from "./ChatMessage";
import useAuthContext from "../hooks/useAuthContext";
import type { Message } from "../types/Message";
import { queryFunction } from "../hooks/useCustomQuery";
import { useEffect, useMemo, useRef, useState } from "react";
import useWebSocketContext from "../hooks/useWebSocketContext";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

const styles = css({
    minHeight: "100%",
    display: "flex",
    flexDirection: "column-reverse",
    overflowY: "auto",
    scrollBehavior: "smooth",
    gap: "10px",
    border: 0,
});

const colors = (theme: Theme) => css({
    backgroundColor: theme.colors.black,
    color: theme.colors.white,
    scrollbarColor: `${theme.colors.dark_grey} ${theme.colors.black}`,
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
    const { data, refetch } = useQuery<Message[]>({
        queryKey: [chatroomId, isLoggedIn, getBefore.toISOString()],
        queryFn: () => queryFunction({fetchUrl: `http://localhost:3000/api/messages/${chatroomId}/${getBefore?.toISOString()}`, 
        user}),
        enabled: false, 
        staleTime: Infinity
    });
    const {wsEventQueues, clearMessageQueue} = useWebSocketContext();
    const [messages, setMessages] = useState<Message[]>([]);
    const chatRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatRef.current) return;
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [chatroomId, messages])

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
        <div ref={chatRef} css={[styles, colors(theme)]}>
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