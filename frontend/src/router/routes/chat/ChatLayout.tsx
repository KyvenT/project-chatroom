import { css, useTheme } from "@emotion/react";
import Sidebar from "../../../components/chat-layout/Sidebar";
import { Outlet } from "react-router";
import useToggle from "../../../hooks/useToggle";
import Header from "../../../components/chat-layout/Header";
import { Link, useParams } from "react-router";
import InboxButton from "../../../components/chat-layout/InboxButton";
import {
  isLoggedInSelector,
  useActiveChatroomStore,
  useAuthStore,
} from "../../../hooks/useStores";
import type { Theme } from "@emotion/react";
import { iconBtnStyles } from "../../../components/Button";
import { useChatroomsStore } from "../../../hooks/useStores";
import AuthGuard from "../../../components/chat/AuthGuard";
import { mq } from "../../../styles/breakpoints";
import { useFetchUserChatrooms } from "../../../hooks/chat-layout/useFetchUserChatrooms";
import { useEffect } from "react";
import { sendWSMessage } from "../../../ws-router/ws";
import { ProfileButton } from "../../../components/chat-layout/ProfileButton";
import { ShowMembersListBtn } from "../../../components/chat-layout/ShowMembersListBtn";
import { ChatroomTitle } from "../../../components/chat-layout/ChatroomTitle";
import { SidebarToggleBtn } from "../../../components/chat-layout/SidebarToggleBtn";

const styles = css({
  height: "100%",
  width: "100%",
  display: "flex",
  backgroundColor: "red",

  ".container": {
    height: "100%",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  ".outletWrapper": {
    flex: 1,
    overflow: "hidden",
  },

  ".blankSpace": {
    flex: 1,
  },

  h1: {
    userSelect: "none",
    fontSize: "2.5rem",
    fontWeight: "450",
  },

  ".headerIconBtn": {
    width: "2.5rem",
    height: "2.5rem",
  },
});

const colors = (theme: Theme) =>
  css(
    mq({
      ".outletWrapper": {
        backgroundColor: theme.colors.black,
      },

      ".headerIconBtn": {
        color: theme.colors.light_grey,
        "&:hover": {
          color: theme.colors.white,
        },
      },

      ".title": {
        fontSize: ["1.25rem", "2.5rem"],
        fontWeight: "450",
        padding: 0,
        color: theme.colors.light_grey,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },

      ".chatroom-details-btn:hover": {
        color: theme.colors.white,
      },
    }),
  );

export type OutletContextType = {
  showMembersList: boolean;
};

function ChatLayout() {
  const [sidebarToggled, setSidebarToggled] = useToggle(false);
  const isLoggedIn = useAuthStore(isLoggedInSelector);
  const { chatroomId } = useParams();
  const theme = useTheme();
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const [showMembersList, setShowMembersList] = useToggle(true);
  const setActiveChatroom = useActiveChatroomStore(
    (state) => state.setActiveChatroomId,
  );
  useFetchUserChatrooms();

  useEffect(() => {
    console.log(
      "ChatLayout mounted, updating active chatroom to: ",
      chatroomId,
    );
    setActiveChatroom(chatroomId);
    sendWSMessage({
      type: "update-active-chatroom",
      chatroomId: chatroomId ? chatroomId : "home",
    });
  }, [chatroomId]);

  const outletContext = {
    showMembersList,
  };

  return (
    <div css={[styles, colors(theme)]}>
      {!isLoggedIn && <AuthGuard />}
      {sidebarToggled && <Sidebar chatrooms={chatrooms} />}
      <div className="container">
        <Header>
          <SidebarToggleBtn
            sidebarToggled={sidebarToggled}
            setSidebarToggled={setSidebarToggled}
          />
          <ChatroomTitle />
          <div className="blankSpace"></div>
          {isLoggedIn ? (
            <>
              <InboxButton />
              <ProfileButton />
              {chatroomId && (
                <ShowMembersListBtn
                  setShowMembersList={() => setShowMembersList()}
                />
              )}
            </>
          ) : (
            <Link to="/login" css={iconBtnStyles(theme)}>
              Sign In
            </Link>
          )}
        </Header>
        <div className="outletWrapper">
          <Outlet context={outletContext} />
        </div>
      </div>
    </div>
  );
}

export default ChatLayout;
