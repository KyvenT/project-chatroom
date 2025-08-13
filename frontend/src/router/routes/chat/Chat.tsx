import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessages from "../../../components/ChatMessages";
import MessageInput from "../../../components/MessageInput";
import { useParams } from "react-router";
import AuthGuard from "../../../components/AuthGuard";

const chatStyles = css({
    minHeight: "100%",
    flexGrow: 1,
    display: "grid",
    gridTemplateRows: "90% 10%",
    gridTemplateColumns: "85% 15%",
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.brown,
    color: theme.colors.dark_grey,
});

function Chat() {
  const theme = useTheme();
  const {chatroomId} = useParams();

  return (
    <div css={[chatStyles, colors(theme)]}>
        <AuthGuard />
        {chatroomId && <ChatMessages chatroomId={chatroomId} />}
        {chatroomId && <div>Chatroom Members</div>}
        <MessageInput />
    </div>
  )
}

export default Chat;
