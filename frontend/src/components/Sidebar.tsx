import { css, useTheme, type Theme } from "@emotion/react";
import SidebarChatroomButton from "./SidebarChatroomButton";
import NewChatButton from "./NewChatButton";
import useAuthContext from "../hooks/useAuthContext";
import { Link, useParams } from "react-router";
import type { Chatroom } from "../types/Chatroom";
import { HomeIcon } from "lucide-react";
import { queryFunction } from "../hooks/useCustomQuery";
import { useQuery } from "@tanstack/react-query";
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

const Sidebar = () => {
  const theme = useTheme();
  const { isLoggedIn, user } = useAuthContext();
  const { chatroomId } = useParams();
  const { data } = useQuery<Chatroom[]>({
    queryKey: ["chatrooms", isLoggedIn],
    queryFn: () => queryFunction<Chatroom[]>({fetchUrl: "http://localhost:3000/api/chatroom/me", user}),
    staleTime: Infinity
  });

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
