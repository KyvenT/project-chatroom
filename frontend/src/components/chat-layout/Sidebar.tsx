import { css, useTheme, type Theme } from "@emotion/react";
import SidebarChatroomButton from "./SidebarChatroomButton";
import NewChatButton from "./NewChatroomBtnAndModal";
import { Link, useParams } from "react-router";
import type { Chatroom } from "../../types/REST-types/Chatroom";
import { HomeIcon, Settings } from "lucide-react";
import { iconBtnStyles } from "../Button";
import { mq } from "../../styles/breakpoints";

const sidebarStyles = (theme: Theme) =>
  css(
    mq({
      height: "100%",
      display: "flex",
      flexDirection: "column",
      flex: "0 0 auto",
      width: ["80%", "50%", "280px", "280px", "280px"],

      ul: {
        listStyle: "none",
        flex: 1,
        padding: "8px 10px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      },

      ".chatsHeader": {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "12px 14px 4px",

        h2: {
          userSelect: "none",
          fontSize: "0.75rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        },
      },

      ".topSection": {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        height: "56px",
        padding: "0 12px",
        borderBottom: `1px solid ${theme.colors.border}`,
      },

      ".homeBtn": {
        padding: "0",
      },

      ".chatrooms": {
        overflowY: "auto",
      },
    }),
  );

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    borderRight: `1px solid ${theme.colors.border}`,

    ".chatsHeader h2": {
      color: theme.colors.light_grey,
    },

    ".topSection a": {
      width: "2.25rem",
      height: "2.25rem",
    },

    ".chatrooms": {
      scrollbarColor: `transparent transparent`,
    },

    ".chatrooms:hover": {
      scrollbarColor: `${theme.colors.borderStrong} transparent`,
    },
  });

type SidebarProps = {
  chatrooms: Chatroom[] | undefined;
};

const Sidebar = ({ chatrooms }: SidebarProps) => {
  const theme = useTheme();
  const { chatroomId } = useParams();

  return (
    <div css={[sidebarStyles(theme), colors(theme)]}>
      <div className="topSection">
        <Link to="/chat" className="homeBtn" css={iconBtnStyles(theme)}>
          <HomeIcon className="homeIcon" size="1.25rem" />
        </Link>
        <Link to="/settings" css={iconBtnStyles(theme)}>
          <Settings size="1.25rem" />
        </Link>
      </div>
      <div className="chatsHeader">
        <h2>Chats</h2>
        <NewChatButton />
      </div>
      <ul className="chatrooms">
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
