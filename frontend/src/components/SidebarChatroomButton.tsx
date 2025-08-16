import { css } from "@emotion/react";
import type React from "react";
import { NavLink } from "react-router";

interface SidebarChatroomButtonProps {
    isActive?: boolean;
    chatroomId: string
    children: React.ReactNode;
}

const styles = css({
    width: "100%",

    ".chatroomLink": {
        backgroundColor: "white",
        width: "100%",
        padding: "10px",
        borderRadius: "5px",

    }
})

const dynamicStyles = (isActive: boolean) => css({
    ".chatroomLink": {
        backgroundColor: isActive ? "white" : "grey",
    }
});

const SidebarChatroomButton = ({isActive=false, children, chatroomId} : SidebarChatroomButtonProps) => {
    return <li css={[styles, dynamicStyles(isActive)]}>
        <NavLink className="chatroomLink" to={"/chat/" + chatroomId}>{children}</NavLink>
    </li>
}

export default SidebarChatroomButton;