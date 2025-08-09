import { css, useTheme, type Theme } from "@emotion/react";
import SidebarChatroomButton from "./SidebarChatroomButton";
import NewChatButton from "./NewChatButton";
import useAuthContext from "../hooks/useAuthContext";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

const sidebarStyles = css({
    display: "flex",
    flexDirection: "column",
    width: "15%",
    minHeight: "100dvh",

    ul: {
        listStyle: "none",
        height: "100%",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    }
})

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.brown,
    color: theme.colors.white,
});

const Sidebar = () => {
    const theme = useTheme();
    const { isLoggedIn, user } = useAuthContext();
    const {chatroomId} = useParams();
    const { data } = useQuery({
        queryKey: ["sidebar", user.token],
        queryFn: async () => {
            console.log("fetching chatrooms");
            if (!isLoggedIn) {
                return;
            }
            const res = await fetch("http://localhost:3000/api/chatroom/me", {
                headers: {
                    "Content-Type": "application/json",
                    "authorization": "Bearer " + user.token
                }
            });
            return await res.json();
        },
        refetchOnMount: false, 
        refetchOnWindowFocus: false,
    })
    console.log("chatrooms: " + data);
    const chatrooms = [
        {title: "Chat 123", chatId: "chat123"},
        {title: "Chat 2", chatId: "chat2"},
        {title: "Chat 3", chatId: "chat3"}
    ]

    return <div css={[sidebarStyles, colors(theme)]}>
        <h3>Chats</h3>
        <ul>
            {chatrooms.map((chatroom) => {
                return (<SidebarChatroomButton 
                    isActive={chatroomId === chatroom.chatId} 
                    chatroomId={chatroom.chatId}>
                        {chatroom.title} 
                </SidebarChatroomButton>)
            })}
        </ul>
        <NewChatButton />
    </div>
}

export default Sidebar;