import { css, useTheme, type Theme } from "@emotion/react";
import SidebarChatroomButton from "./SidebarChatroomButton";
import NewChatButton from "./NewChatButton";
import { Link, useParams } from "react-router";
import type { Chatroom } from "../types/Chatroom";
import { HomeIcon } from "lucide-react";
import { iconBtnStyles } from "./Button";

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
    gap: "4px",
  },

  ".chatsHeader": {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "0 4px",

    h2: {
      userSelect: "none",
    },
  },

  ".homeBtnContainer": {
    display: "flex",
    alignItems: "center",
    padding: "4px",
  },

  ".homeBtn": {},

  ".homeIcon": {
    width: "2rem",
    height: "2rem",
  },
});

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,

    ".homeBtnContainer": {},
  });

type SidebarProps = {
  chatrooms: Chatroom[] | undefined,
}

const Sidebar = ({chatrooms}: SidebarProps) => {
  const theme = useTheme();
  const { chatroomId } = useParams();

  return (
    <div css={[sidebarStyles, colors(theme)]}>
      <div className="homeBtnContainer">
        <Link to="/chat" className="homeBtn" css={iconBtnStyles(theme)}>
          <HomeIcon className="homeIcon" />
        </Link>
      </div>
      <div className="chatsHeader">
        <h2>Chats</h2>
        <NewChatButton />
      </div>
      <ul>
        {chatrooms &&
          chatrooms.map((chatroom) => {
            return (
              <SidebarChatroomButton
                key={chatroom.chatroomId}
                isActive={chatroomId === chatroom.chatroomId}
                chatroomId={chatroom.chatroomId}
              >
                {chatroom.chatroom.title}
              </SidebarChatroomButton>
            );
          })}
      </ul>
    </div>
  );
};

export default Sidebar;
