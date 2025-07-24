/** @jsxImportSource @emotion/react */
import { jsx, css } from "@emotion/react";

const sidebarStyles = css({
    display: "flex",
    flexDirection: "column",
    width: "25%",
})

const Sidebar = () => {
    return <div css={sidebarStyles}>
        <h3>Chats</h3>
        <ul>
            <li>Chat 1</li>
        </ul>
    </div>
}