import { css, useTheme, type Theme } from "@emotion/react";
import SidebarChatroomButton from "./SidebarChatroomButton";

const sidebarStyles = css({
    display: "flex",
    flexDirection: "column",
    width: "10%",
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

    return <div css={[sidebarStyles, colors(theme)]}>
        <h3>Chats</h3>
        <ul>
            <SidebarChatroomButton title="Chat 1" isActive />
            <SidebarChatroomButton title="Chat 2" />
            <SidebarChatroomButton title="Chat 3" />
        </ul>
    </div>
}

export default Sidebar;