import { css, useTheme } from "@emotion/react";
import Sidebar from "../../../components/Sidebar";
import { Outlet } from "react-router";
import useToggle from "../../../hooks/useToggle";
import Header, { headerBtnStylesWithColors } from "../../../components/Header";
import DropdownButton from "../../../components/DropdownButton";
import { Link, useNavigate, useParams } from "react-router";
import InboxButton from "../../../components/InboxButton";
import { ChevronFirst, MenuIcon } from "lucide-react";
import useAuthContext from "../../../hooks/useAuthContext";
import useWebSocketContext from "../../../hooks/useWebSocketContext";
import { useEffect } from "react";
import {
  wsMessageRouter,
  type wsEventQueuesType,
} from "../../../ws-router/ws-message-router";
import type { Theme } from "@emotion/react";

const styles = css({
  minHeight: "100dvh",
  width: "100%",
  display: "flex",

  ".container": {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    maxHeight: "100dvh",
  },

  ".outletWrapper": {
    flex: 1,
    display: "flex",
    backgroundColor: "red",
    overflow: "hidden",
  },

  ".sidebarToggleBtn": {
    backgroundColor: "inherit",
    border: 0,
  },
});

const colors = (theme: Theme) =>
  css({
    ".outletWrapper": {
      backgroundColor: theme.colors.black,
    },

    ".sidebarToggleBtn": {
      color: theme.colors.white,
    },

    ".sidebarToggleBtn:hover": {
      color: theme.colors.grey,
    },
  });

export interface ChatLayoutContext {
  wsEventQueues: wsEventQueuesType;
  setWsEventQueues: React.Dispatch<React.SetStateAction<wsEventQueuesType>>;
}

function ChatLayout() {
  const [sidebarToggled, setSidebarToggled] = useToggle(false);
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthContext();
  const { chatroomId } = useParams();
  const { wsEventQueues, setWsEventQueues, ws } = useWebSocketContext();
  const theme = useTheme();

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Message from server: ", message);
        wsMessageRouter(wsEventQueues, setWsEventQueues, message);
      };
    }
  }, [ws]);

  return (
    <div css={[styles, colors(theme)]}>
      {sidebarToggled && <Sidebar />}
      <div className="container">
        <Header>
          <button
            className="sidebarToggleBtn"
            onClick={() => setSidebarToggled()}
          >
            {sidebarToggled ? <ChevronFirst /> : <MenuIcon />}
          </button>
          <h1>{chatroomId || "Welcome"}</h1>
          {isLoggedIn ? (
            <>
              <InboxButton />
              <DropdownButton buttonText="Profile">
                <h3>{user.username}</h3>
                <Link to="">Account Settings</Link>
                <button
                  onClick={() => navigate("/logout")}
                  css={headerBtnStylesWithColors}
                >
                  Log Out
                </button>
              </DropdownButton>
            </>
          ) : (
            <Link to="/login" css={headerBtnStylesWithColors}>
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
