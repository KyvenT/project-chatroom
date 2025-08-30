import { css, useTheme } from "@emotion/react";
import Sidebar from "../../../components/Sidebar";
import { Outlet } from "react-router";
import useToggle from "../../../hooks/useToggle";
import Header from "../../../components/Header";
import DropdownButton from "../../../components/DropdownButton";
import { Link, useNavigate, useParams } from "react-router";
import InboxButton from "../../../components/InboxButton";
import { ArrowLeftToLine, MenuIcon, User } from "lucide-react";
import useAuthContext from "../../../hooks/useAuthContext";
import useWebSocketContext from "../../../hooks/useWebSocketContext";
import { useEffect } from "react";
import {
  wsMessageRouter,
  type wsEventQueuesType,
} from "../../../ws-router/ws-message-router";
import type { Theme } from "@emotion/react";
import Button, { iconBtnStyles } from "../../../components/Button";

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
});

const colors = (theme: Theme) =>
  css({
    ".outletWrapper": {
      backgroundColor: theme.colors.black,
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
          <Button
            variant="icon"
            className="sidebarToggleBtn"
            onClick={() => setSidebarToggled()}
          >
            {sidebarToggled ? <ArrowLeftToLine /> : <MenuIcon />}
          </Button>
          <h1>{chatroomId || "Welcome"}</h1>
          {isLoggedIn ? (
            <>
              <InboxButton />
              <DropdownButton buttonText={<User />} buttonStyles={iconBtnStyles(theme)}>
                <h3>{user.username}</h3>
                <Link to="">Account Settings</Link>
                <Button
                  onClick={() => navigate("/logout")}
                  css={iconBtnStyles(theme)}
                >
                  Log Out
                </Button>
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
