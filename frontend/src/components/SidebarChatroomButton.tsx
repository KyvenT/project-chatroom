import type React from "react";
import { NavLink } from "react-router";

interface SidebarChatroomButtonProps {
    isActive?: boolean;
    chatroomId: string
    children: React.ReactNode;
}

const styles = {
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
}

const dynamicStyles = (isActive: boolean) => ({
    backgroundColor: isActive ? "blue" : "grey",
});

const SidebarChatroomButton = ({isActive=false, children, chatroomId} : SidebarChatroomButtonProps) => {
    return <li>
        <NavLink css={[styles, dynamicStyles(isActive)]} to={"/chat/" + chatroomId}>{children}</NavLink>
    </li>
}

export default SidebarChatroomButton;