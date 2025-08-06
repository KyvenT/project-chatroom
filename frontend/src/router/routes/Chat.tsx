import { css, useTheme, type Theme } from "@emotion/react";
import Sidebar from "../../components/Sidebar";
import Header, { headerBtnStylesWithColors } from "../../components/Header";
import ChatMessages from "../../components/ChatMessages";
import MessageInput from "../../components/MessageInput";
import DropdownButton from "../../components/DropdownButton";
import ProfileButton from "../../components/ProfileButton";
import { Link } from "react-router";
import useAuthContext from "../../hooks/useAuthContext";

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

  return (
    <div css={styles}>
      <Sidebar />
        <div css={[chatStyles, colors(theme)]}>
            <Header>
              <h1>Chatroom #1</h1>
              <DropdownButton buttonText="Inbox">
                <ul>
                    <li>Message 1</li>
                    <li>Message 2</li>
                    <li>Message 3</li>
                </ul>
              </DropdownButton>
              <DropdownButton buttonText="Profile">
                <a>Account</a>
                <button>Log Out</button>
              </DropdownButton>
              {isLoggedIn &&
              <Link to="/auth/login" css={headerBtnStylesWithColors}>
                  Sign In
              </Link>}
            </Header>
            <ChatMessages />
            <MessageInput />
        </div>
    </div>
  )
}

export default Chat;
