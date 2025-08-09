import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessage from "./ChatMessage";
import { useQuery } from "@tanstack/react-query";
import useAuthContext from "../hooks/useAuthContext";

interface ChatMessageProps {
    chatroomId: string;
}

const styles = css({
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
});

const ChatMessages = ({chatroomId}: ChatMessageProps) => {
    const theme = useTheme();
    const {user} = useAuthContext();
    const getBefore = new Date();
    const { data } = useQuery({
        queryKey: ["messages", chatroomId],
        queryFn: async () => {
            console.log("fetching messages");
            const res = await fetch("http://localhost:3000/api/messages/" + chatroomId + "/" + getBefore.toISOString(), {
                headers: {
                    "Content-Type": "application/json",
                    "authorization": "Bearer " + user.token,
                },
            });
            console.log(res);
            return await res.json();
        }, 
        refetchOnMount: false, 
        refetchOnWindowFocus: false
    })
    console.log("messages: " + data);

    return (
        <div css={[styles, colors(theme)]}>
            <ChatMessage
                content="Hello, how are you?"
                sender="User1"
                timestamp={new Date()}
            />
            <ChatMessage
                content="I'm good, thanks! How about you?"
                sender="User2"
                timestamp={new Date()}
            />
            <ChatMessage
                content="lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
                sender="User1"
                timestamp={new Date()}
            />
        </div>
    );
}

export default ChatMessages;