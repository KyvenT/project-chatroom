import { css, useTheme, type Theme } from "@emotion/react";
import Header, { headerBtnStylesWithColors } from "../../../components/Header";
import ChatMessages from "../../../components/ChatMessages";
import MessageInput from "../../../components/MessageInput";
import DropdownButton from "../../../components/DropdownButton";
import { Link, useOutletContext, useParams } from "react-router";
import useAuthContext from "../../../hooks/useAuthContext";
import InboxButton from "../../../components/InboxButton";
import type { SidebarContextType } from "./ChatLayout";
import { ChevronFirst, ChevronLast } from "lucide-react";

const chatStyles = css({
    minHeight: "100%",
    flexGrow: 1,
    display: "grid",
    gridTemplateRows: "8% 87% 5%",
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.brown,
    color: theme.colors.dark_grey,
});

function Chat() {
  const theme = useTheme();
  const {isLoggedIn, user} = useAuthContext();
  const {chatroomId} = useParams();
  const {setSidebarToggled, sidebarToggled} = useOutletContext<SidebarContextType>();

  return (
    <div css={[chatStyles, colors(theme)]}>
        <Header>
          <button onClick={() => setSidebarToggled()}>{sidebarToggled ? <ChevronFirst /> : <ChevronLast />}</button>

          <h1>Chatroom {chatroomId}</h1>
          {isLoggedIn ?
          <>
            <InboxButton />
            <DropdownButton buttonText="Profile">
              <h3>{user.username}</h3>
              <Link to="">Account Settings</Link>
              <button css={headerBtnStylesWithColors}>Log Out</button>
            </DropdownButton>
          </>
          :
          <Link to="/login" css={headerBtnStylesWithColors}>
              Sign In
          </Link>}
        </Header>
        {chatroomId && <ChatMessages chatroomId={chatroomId} />}
        <MessageInput />
    </div>
  )
}

export default Chat;
