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
import { PopoutDock } from "../../../components/popout/PopoutDock";
import { useConnectionStore } from "../../../hooks/useConnectionStore";
import { PopoutWindow } from "../../../components/popout/PopoutWindow";
import { PopoutButton } from "../../../components/popout/PopoutButton";

const styles = css({
  height: "100%",
  width: "100%",
  display: "flex",

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
  },

  ".headerIconBtn": {
    width: "2.25rem",
    height: "2.25rem",
    padding: "7px",
  },
});

const colors = (theme: Theme) =>
  css(
    mq({
      ".outletWrapper": {
        backgroundColor: theme.colors.black,
      },

      ".headerIconBtn": {
        color: "inherit",
        borderRadius: theme.radius.sm,
      },

      ".title": {
        fontSize: ["1rem", "1.1rem"],
        fontWeight: 600,
        letterSpacing: "-0.01em",
        padding: "6px 10px",
        color: theme.colors.white,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },

      ".chatroom-details-btn:hover": {
        backgroundColor: theme.colors.grey,
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
  const connectionId = useConnectionStore((state) => state.connectionId);
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
    // (resent after reconnecting; the server forgets it with the connection)
  }, [chatroomId, connectionId]);

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
              {chatroomId && (
                <PopoutButton
                  chatroomId={chatroomId}
                  title={
                    chatrooms.find((c) => c.chatroomId === chatroomId)?.chatroom
                      .title ?? "chat"
                  }
                  iconClassName="headerIconBtn"
                />
              )}
              <InboxButton />
              <ProfileButton />
              {chatroomId && (
                <ShowMembersListBtn
                  setShowMembersList={() => setShowMembersList()}
                />
              )}
            </>
          ) : (
            <Link
              to="/login"
              css={[
                iconBtnStyles(theme),
                {
                  padding: "6px 14px",
                  backgroundColor: theme.colors.accent,
                  color: theme.colors.onAccent,
                  fontWeight: 500,
                  textDecoration: "none",
                  "&:hover": {
                    backgroundColor: theme.colors.accentHover,
                    color: theme.colors.onAccent,
                    textDecoration: "none",
                  },
                },
              ]}
            >
              Sign In
            </Link>
          )}
        </Header>
        <div className="outletWrapper">
          <Outlet context={outletContext} />
        </div>
      </div>
      {isLoggedIn && (
        <>
          <PopoutDock />
          <PopoutWindow />
        </>
      )}
    </div>
  );
}

export default ChatLayout;
