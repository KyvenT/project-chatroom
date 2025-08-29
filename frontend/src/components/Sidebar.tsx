import { css, useTheme, type Theme } from "@emotion/react";
import SidebarChatroomButton from "./SidebarChatroomButton";
import NewChatButton from "./NewChatButton";
import useAuthContext from "../hooks/useAuthContext";
import { Link, useParams } from "react-router";
import type { Chatroom } from "../types/Chatroom";
import { HomeIcon } from "lucide-react";
import { useCustomQuery } from "../hooks/useCustomQuery";

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

    ".homeBtn": {
      color: theme.colors.white,
    },

    ".homeBtn:hover": {
      color: theme.colors.light_grey,
    },
  });

const Sidebar = () => {
  const theme = useTheme();
  const { isLoggedIn, user } = useAuthContext();
  const { chatroomId } = useParams();
  const { data } = useCustomQuery<Chatroom>(
    ["chatrooms", isLoggedIn ? user.userId : "not logged in"],
    "chatroom",
  );

  return (
    <div css={[sidebarStyles, colors(theme)]}>
      <div className="homeBtnContainer">
        <Link to="/chat" className="homeBtn">
          <HomeIcon className="homeIcon" />
        </Link>
      </div>
      <div className="chatsHeader">
        <h2>Chats</h2>
        <NewChatButton />
      </div>
      <ul>
        {data &&
          data.map((chatroom) => {
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
