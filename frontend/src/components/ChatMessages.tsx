import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessage from "./ChatMessage";
import { useQuery } from "@tanstack/react-query";
import useAuthContext from "../hooks/useAuthContext";
import type { Message } from "../types/Message";

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
    const { data } = useQuery({
        queryKey: ["messages", chatroomId, isLoggedIn],
        queryFn: async () => {
            if (!isLoggedIn) return [];
            console.log("fetching messages");
            const res = await fetch("http://localhost:3000/api/messages/" + chatroomId + "/" + getBefore.toISOString(), {
                headers: {
                    "Content-Type": "application/json",
                    "authorization": "Bearer " + user.token,
                },
            });
            if (!res.ok) {
                console.error(res);
                return [];
            }
            console.log(res);
            return await res.json() as Message[];
        }, 
        staleTime: Infinity
    })
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