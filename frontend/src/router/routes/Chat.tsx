import { css, useTheme, type Theme } from "@emotion/react";
import Sidebar from "../../components/Sidebar";
import Header, { headerBtnStylesWithColors } from "../../components/Header";
import ChatMessages from "../../components/ChatMessages";
import MessageInput from "../../components/MessageInput";
import DropdownButton from "../../components/DropdownButton";
import { Link, useParams } from "react-router";
import useAuthContext from "../../hooks/useAuthContext";
import useToggle from "../../hooks/useToggle";
import { ChevronFirst, ChevronLast } from "lucide-react";
import InboxButton from "../../components/InboxButton";

const styles = css({
  minHeight: "100dvh",
  width: "100%",
  display: "flex",
})

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
  const {isLoggedIn} = useAuthContext();
  const [sidebarToggled, setSidebarToggled] = useToggle(false);
  const {chatroomId} = useParams();

  return (
    <div css={styles}>
      {sidebarToggled && <Sidebar />}
        <div css={[chatStyles, colors(theme)]}>
            <Header>
              <button onClick={() => setSidebarToggled()}>{sidebarToggled ? <ChevronFirst /> : <ChevronLast />}</button>
              <h1>Chatroom {chatroomId}</h1>
              {isLoggedIn ?
              <>
                <InboxButton />
                <DropdownButton buttonText="Profile">
                  <a>Account</a>
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
    </div>
  )
}

export default Chat;
