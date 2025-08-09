import { css, useTheme, type Theme } from "@emotion/react";
import SidebarChatroomButton from "./SidebarChatroomButton";
import NewChatButton from "./NewChatButton";
import useAuthContext from "../hooks/useAuthContext";
import { useQuery } from "@tanstack/react-query";

const sidebarStyles = css({
    display: "flex",
    flexDirection: "column",
    width: "15%",
    minHeight: "100dvh",

    ul: {
        listStyle: "none",
        padding: 0,
    }
})

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.brown,
    color: theme.colors.white,
});

const Sidebar = () => {
    const theme = useTheme();
    const { isLoggedIn, user } = useAuthContext();
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
        refetchOnWindowFocus: false
    })
    console.log("chatrooms: " + data);

    return <div css={[sidebarStyles, colors(theme)]}>
        <h3>Chats</h3>
        <ul>
            <SidebarChatroomButton title="Chat 1" isActive />
            <SidebarChatroomButton title="Chat 2" />
            <SidebarChatroomButton title="Chat 3" />
        </ul>
        <NewChatButton />
    </div>
}

export default Sidebar;