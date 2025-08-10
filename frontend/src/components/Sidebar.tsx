import { css, useTheme, type Theme } from "@emotion/react";
import SidebarChatroomButton from "./SidebarChatroomButton";
import NewChatButton from "./NewChatButton";
import useAuthContext from "../hooks/useAuthContext";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import type { Chatroom } from "../types/Chatroom";
import { useMemo } from "react";

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
        queryKey: ["sidebar", isLoggedIn],
        queryFn: async () => {
            if (!isLoggedIn) {
                return [];
            }
            console.log("fetching chatrooms");
            const res = await fetch("http://localhost:3000/api/chatroom/me", {
                headers: {
                    "Content-Type": "application/json",
                    "authorization": "Bearer " + user.token
                }
            });
            return await res.json();
        },
        staleTime: Infinity
    })
    const chatrooms = useMemo(() => data ? data.chatrooms as Chatroom[] : [], data);
    console.log("chatrooms: " + chatrooms);

    return <div css={[sidebarStyles, colors(theme)]}>
        <h3>Chats</h3>
        <ul>
            {chatrooms && chatrooms.map((chatroom) => {
                return (
                <SidebarChatroomButton key={chatroom.chatroomId}
                    isActive={chatroomId === chatroom.chatroomId} 
                    chatroomId={chatroom.chatroomId}>
                        {chatroom.chatroom.title} 
                </SidebarChatroomButton>)
            })}
        </ul>
        <NewChatButton />
    </div>
}

export default Sidebar;