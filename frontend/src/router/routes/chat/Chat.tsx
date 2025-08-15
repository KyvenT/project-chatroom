import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessages from "../../../components/ChatMessages";
import MessageInput from "../../../components/MessageInput";
import { useParams } from "react-router";
import MemberList from "../../../components/MemberList";
import useAuthContext from "../../../hooks/useAuthContext";
import useWebSocketContext from "../../../hooks/useWebSocketContext";
import { useRef } from "react";
import AuthGuard from "../../../components/AuthGuard";

const chatStyles = css({
  minHeight: "100%",
  flexGrow: 1,
  display: "grid",
  gridTemplateRows: "90% 10%",
  gridTemplateColumns: "85% 15%",
});

const colors = (theme: Theme) => css({
  backgroundColor: theme.colors.brown,
  color: theme.colors.dark_grey,
});

function Chat() {
  const theme = useTheme();
  const {chatroomId} = useParams();
  const {isLoggedIn} = useAuthContext();
  const {ws} = useWebSocketContext();
  const messageInput = useRef<HTMLInputElement>(null);


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!isLoggedIn || !messageInput.current || !chatroomId) return;

      ws?.send(JSON.stringify({
          type: "message", 
          content: messageInput.current.value,
          chatroomId,
      }));
  };

  return (
    <div css={[chatStyles, colors(theme)]}>
        <AuthGuard />
      {chatroomId && <ChatMessages chatroomId={chatroomId} />}
      {chatroomId && <MemberList />}
      <MessageInput messageInputRef={messageInput} handleSubmit={handleSubmit} />
    </div>
  )
}

export default Chat;
