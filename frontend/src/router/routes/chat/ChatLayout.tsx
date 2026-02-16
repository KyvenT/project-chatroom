import { css, useTheme } from "@emotion/react";
import Sidebar from "../../../components/chat-layout/Sidebar";
import { Outlet } from "react-router";
import useToggle from "../../../hooks/useToggle";
import Header from "../../../components/chat-layout/Header";
import DropdownButton from "../../../components/DropdownButton";
import { Link, useNavigate, useParams } from "react-router";
import InboxButton from "../../../components/chat-layout/InboxButton";
import { ArrowLeftToLine, MenuIcon, User, Users } from "lucide-react";
import { isLoggedInSelector, useAuthStore } from "../../../hooks/useStores";
import type { Theme } from "@emotion/react";
import Button, { iconBtnStyles } from "../../../components/Button";
import { useChatroomsStore } from "../../../hooks/useStores";
import { ChatroomDetailsModal } from "../../../components/chat-layout/ChatroomDetailsModal";
import AuthGuard from "../../../components/chat/AuthGuard";
import { mq } from "../../../styles/breakpoints";
import { useChatroomTitle } from "../../../hooks/chat-layout/useChatroomTitle";
import { useFetchUserChatrooms } from "../../../hooks/chat-layout/useFetchUserChatrooms";
import { useWebsocketRouter } from "../../../hooks/chat-layout/useWebsocketRouter";
import { useUpdateActiveChatroom } from "../../../hooks/chat-layout/useUpdateActiveChatroom";

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
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = isLoggedInSelector(useAuthStore.getState());
  const { chatroomId } = useParams();
  const theme = useTheme();
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const [openChatroomDetails, setOpenChatroomDetails] = useToggle(false);
  const [showMembersList, setShowMembersList] = useToggle(true);
  const chatroomTitle = useChatroomTitle();
  useFetchUserChatrooms();
  useWebsocketRouter();
  useUpdateActiveChatroom();

  const outletContext = {
    showMembersList,
  };

  return (
    <div css={[styles, colors(theme)]}>
      {!isLoggedIn && <AuthGuard />}
      {sidebarToggled && <Sidebar chatrooms={chatrooms} />}
      <div className="container">
        <Header>
          <Button
            variant="icon"
            className="sidebarToggleBtn"
            onClick={() => setSidebarToggled()}
            aria-label="Toggle sidebar"
          >
            {sidebarToggled ? (
              <ArrowLeftToLine className="headerIconBtn" />
            ) : (
              <MenuIcon className="headerIconBtn" />
            )}
          </Button>
          {chatroomTitle && chatroomId ? (
            <>
              <Button
                onClick={() => setOpenChatroomDetails(true)}
                variant="icon"
                className="title chatroom-details-btn"
                aria-label="Open chatroom details"
              >
                {chatroomTitle}
              </Button>
              {openChatroomDetails && (
                <ChatroomDetailsModal
                  open={openChatroomDetails}
                  onClose={() => setOpenChatroomDetails(false)}
                  chatroomId={chatroomId}
                  user={user}
                  key={chatroomId}
                />
              )}
            </>
          ) : (
            <h1 className="title">Home</h1>
          )}
          <div className="blankSpace"></div>
          {isLoggedIn ? (
            <>
              <InboxButton />
              <DropdownButton
                buttonText={<User className="headerIconBtn" />}
                buttonVariant="icon"
              >
                <h3>{user.username}</h3>
                <Link to="/account">Account</Link>
                <Button onClick={() => navigate("/logout")}>Log Out</Button>
              </DropdownButton>
              {chatroomId && (
                <Button onClick={() => setShowMembersList()} variant="icon">
                  <Users className="headerIconBtn" />
                </Button>
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
