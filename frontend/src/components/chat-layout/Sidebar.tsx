import { css, useTheme, type Theme } from "@emotion/react";
import SidebarChatroomButton from "./SidebarChatroomButton";
import NewChatButton from "./NewChatroomBtnAndModal";
import { Link, useParams } from "react-router";
import type { Chatroom } from "../../types/REST-types/Chatroom";
import { HomeIcon, Settings } from "lucide-react";
import { iconBtnStyles } from "../Button";
import { mq } from "../../styles/breakpoints";

const sidebarStyles = css(
  mq({
    height: "100%",
    display: "flex",
    flexDirection: "column",
    flex: "0 0 auto",
    width: ["80%", "50%", "25%", "20%", "15%"],

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
        fontSize: "1.75rem",
        fontWeight: "400",
      },
    },

    ".topSection": {
      display: "flex",
      alignItems: "center",
      padding: "4px",
    },

    ".homeBtn": {
      padding: "2px",
    },
  }),
);

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,
    color: theme.colors.white,
    borderRight: `2px solid ${theme.colors.dark_grey}`,

    ".homeBtn": {
      color: theme.colors.light_grey,

      "&:hover": {
        color: theme.colors.white,
        backgroundColor: theme.colors.grey,
      },
    },
  });

type SidebarProps = {
  chatrooms: Chatroom[] | undefined;
};

const Sidebar = ({ chatrooms }: SidebarProps) => {
  const theme = useTheme();
  const { chatroomId } = useParams();

  return (
    <div css={[sidebarStyles, colors(theme)]}>
      <div className="topSection">
        <Link to="/chat" className="homeBtn" css={iconBtnStyles(theme)}>
          <HomeIcon className="homeIcon" size="2.25rem" />
        </Link>
        <Link to="/settings" css={iconBtnStyles(theme)}>
          <Settings size="2.25rem" />
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
                chatroom={chatroom}
              />
            );
          })}
      </ul>
    </div>
  );
};

export default Sidebar;
