import { css, useTheme, type Theme } from "@emotion/react";
import SidebarChatroomButton from "./SidebarChatroomButton";
import NewChatButton from "./NewChatButton";
import useAuthContext from "../hooks/useAuthContext";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import type { Chatroom } from "../types/Chatroom";
import { HomeIcon } from "lucide-react";

const sidebarStyles = css({
    display: "flex",
    flexDirection: "column",
    width: "15%",
    minHeight: "100dvh",

    ul: {
        listStyle: "none",
        flex: 1,
        padding: "20px 10px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },

    ".homeBtnContainer": {
        display: "flex",
        alignItems: "center",
        justifyContent: "",
    }, 

    ".homeBtn": {
    },

    ".homeIcon": {
        width: "3rem",
        height: "3rem",
    }
})

const colors = (theme: Theme) => css({
    backgroundColor: theme.colors.brown,
    color: theme.colors.white,

    ".homeBtnContainer": {

    }, 

    ".homeBtn": {
        color: theme.colors.dark_grey,
    },

    ".homeBtn:hover": {
        color: theme.colors.light_grey,
    }
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
            if (!res.ok) {
                console.error(res);
                return [];
            }
            return await res.json() as Chatroom[];
        },
        staleTime: Infinity
    })


    return <div css={[sidebarStyles, colors(theme)]}>
        <div className="homeBtnContainer">
            <Link to="/chat" className="homeBtn"><HomeIcon className="homeIcon" /></Link>
        </div>
        <h2>Chats</h2>
        <ul>
            {data && data.map((chatroom) => {
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