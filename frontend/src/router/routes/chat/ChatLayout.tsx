import { css } from "@emotion/react";
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
import { useEffect, useState } from "react";
import type { Message } from "../../../types/Message";
import {wsMessageRouter, type wsEventQueuesType} from "../../../ws-router/ws-message-router"


const styles = css({
  minHeight: "100dvh",
  width: "100%",
  display: "flex",

  ".container": {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column"
  },

  ".outletWrapper": {
    flex: 1,
    maxHeight: "100%"
  }
})

export interface ChatLayoutContext {
  wsEventQueues: wsEventQueuesType;
  setWsEventQueues: React.Dispatch<React.SetStateAction<wsEventQueuesType>>;
}

function ChatLayout() {
  const [sidebarToggled, setSidebarToggled] = useToggle(false);
  const navigate = useNavigate();
  const {isLoggedIn, user} = useAuthContext();
  const {chatroomId} = useParams();
  const {ws} = useWebSocketContext();
  const {wsEventQueues, setWsEventQueues} = useWebSocketContext();
  
  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log("Message from server: ", message);
        console.log("Event Queues before: ", wsEventQueues);
        wsMessageRouter(wsEventQueues, setWsEventQueues, message);
        console.log("Event Queues after: ", wsEventQueues);
      }
    }

  }, [ws]);

  return (
    <div css={styles}>
      {sidebarToggled && <Sidebar />}
        <div className="container">
          <Header>
            <button onClick={() => setSidebarToggled()}>{
              sidebarToggled ? <ChevronFirst /> : <MenuIcon />
            }</button>
            <h1>{chatroomId || "Welcome"}</h1>
            {isLoggedIn ?
            <>
              <InboxButton />
              <DropdownButton buttonText="Profile">
                <h3>{user.username}</h3>
                <Link to="">Account Settings</Link>
                <button onClick={() => navigate("/logout")} css={headerBtnStylesWithColors}>Log Out</button>
              </DropdownButton>
            </>
            :
            <Link to="/login" css={headerBtnStylesWithColors}>
                Sign In
            </Link>}
          </Header>
          <div className="outletWrapper">
            <Outlet context={
              {wsEventQueues, setWsEventQueues} satisfies ChatLayoutContext} />
          </div>
        </div>
    </div>
  )
}

export default ChatLayout;
