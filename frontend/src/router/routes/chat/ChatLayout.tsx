import { css, useTheme } from "@emotion/react";
import Sidebar from "../../../components/chat-layout/Sidebar";
import { Outlet } from "react-router";
import useToggle from "../../../hooks/useToggle";
import Header from "../../../components/chat-layout/Header";
import DropdownButton from "../../../components/DropdownButton";
import { Link, useNavigate, useParams } from "react-router";
import InboxButton from "../../../components/chat-layout/InboxButton";
import { ArrowLeftToLine, MenuIcon, User } from "lucide-react";
import useAuthContext from "../../../hooks/useAuthContext";
import useWebSocketContext from "../../../hooks/useWebSocketContext";
import { useEffect, useState } from "react";
import type { Theme } from "@emotion/react";
import Button, { iconBtnStyles } from "../../../components/Button";
import { useQuery } from "@tanstack/react-query";
import type { Chatroom } from "../../../types/REST-types/Chatroom";
import { queryFunction } from "../../../hooks/useCustomQuery";
import { wsMessageRouter } from "../../../ws-router/ws-message-router";
import { useChatroomsStore } from "../../../hooks/useStores";
import { ChatroomDetailsModal } from "../../../components/chat-layout/ChatroomDetailsModal";

const styles = css({
  height: "100dvh",
  width: "100dvw",
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
    minHeight: 0,
  },

  ".blankSpace": {
    flex: 1,
  },

  h1: {
    userSelect: "none",
    fontSize: "2rem",
    fontWeight: "450",
  },
});

const colors = (theme: Theme) =>
  css({
    ".outletWrapper": {
      backgroundColor: theme.colors.black,
    },

    ".sidebarToggleBtn": {
      color: theme.colors.light_grey,
      "&:hover": {
        color: theme.colors.white,
      },
    },
  });

const titleStyles = (theme: Theme) =>
  css({
    fontSize: "2rem",
    fontWeight: "450",
    padding: 0,
    color: theme.colors.white,

    "&:hover": {
      color: theme.colors.light_grey,
    },
  });

function ChatLayout() {
  const [sidebarToggled, setSidebarToggled] = useToggle(false);
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthContext();
  const { chatroomId } = useParams();
  const { ws } = useWebSocketContext();
  const theme = useTheme();
  const setChatroomList = useChatroomsStore((state) => state.setChatroomList);
  const chatrooms = useChatroomsStore((state) => state.chatrooms);
  const [chatroomTitle, setChatroomTitle] = useState<string | null>(null);
  const [openChatroomDetails, setOpenChatroomDetails] = useToggle(false);

  const { data: chatroomsData } = useQuery<Chatroom[]>({
    queryKey: ["chatrooms", isLoggedIn],
    queryFn: () =>
      queryFunction<Chatroom[]>({
        fetchUrl: "http://localhost:3000/api/chatrooms/me",
        user,
      }),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!chatroomId) {
      setChatroomTitle(null);
      return;
    }

    const chatroom = chatrooms.find(
      (chatroom) => chatroom.chatroomId === chatroomId,
    );
    if (chatroom?.chatroomId === chatroomId) {
      setChatroomTitle(chatroom.chatroom.title);
    } else {
      setChatroomTitle(chatroomId);
    }
  }, [chatroomId, chatrooms]);

  useEffect(() => {
    if (chatroomsData) setChatroomList(chatroomsData);
  }, [chatroomsData]);

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Message from server: ", message);
        wsMessageRouter(message, chatroomId, navigate);
      };
    }
  }, [ws, chatroomId, navigate]);

  return (
    <div css={[styles, colors(theme)]}>
      {sidebarToggled && <Sidebar chatrooms={chatrooms} />}
      <div className="container">
        <Header>
          <Button
            variant="icon"
            className="sidebarToggleBtn"
            onClick={() => setSidebarToggled()}
          >
            {sidebarToggled ? <ArrowLeftToLine /> : <MenuIcon />}
          </Button>
          {chatroomTitle ? (
            <Button
              onClick={() => setOpenChatroomDetails(true)}
              variant="icon"
              otherStyles={titleStyles(theme)}
            >
              {chatroomTitle}
            </Button>
          ) : (
            <h1>Welcome</h1>
          )}
          {chatroomId && (
            <ChatroomDetailsModal
              open={openChatroomDetails}
              onClose={() => setOpenChatroomDetails(false)}
              chatroomId={chatroomId}
              user={user}
            />
          )}
          <div className="blankSpace"></div>
          {isLoggedIn ? (
            <>
              <InboxButton />
              <DropdownButton
                buttonText={<User />}
                buttonStyles={iconBtnStyles(theme)}
              >
                <h3>{user.username}</h3>
                <Link to="">Account Settings</Link>
                <Button onClick={() => navigate("/logout")}>Log Out</Button>
              </DropdownButton>
            </>
          ) : (
            <Link to="/login" css={iconBtnStyles(theme)}>
              Sign In
            </Link>
          )}
        </Header>
        <div className="outletWrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default ChatLayout;
