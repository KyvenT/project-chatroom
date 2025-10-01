import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessages from "../../../components/chat/ChatMessages";
import MessageInput from "../../../components/chat/MessageInput";
import { useOutletContext, useParams } from "react-router";
import MemberList from "../../../components/chat/MemberList";
import useAuthContext from "../../../hooks/useAuthContext";
import useWebSocketContext from "../../../hooks/useWebSocketContext";
import { useRef } from "react";
import type { OutletContextType } from "./ChatLayout";

const chatStyles = css({
  height: "100%",
  display: "flex",

  ".chatContainer": {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
});

const colors = (theme: Theme) =>
  css({
    color: theme.colors.dark_grey,
  });

function Chat() {
  const theme = useTheme();
  const { chatroomId } = useParams();
  const { isLoggedIn } = useAuthContext();
  const { ws } = useWebSocketContext();
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const { showMembersList } = useOutletContext<OutletContextType>();

  const handleSubmit = () => {
    if (!isLoggedIn || !messageInput.current || !chatroomId) return;

    ws?.send(
      JSON.stringify({
        type: "message",
        content: messageInput.current.value,
        chatroomId,
      }),
    );

    messageInput.current.value = "";
    messageInput.current.focus();
  };

  return (
    <div css={[chatStyles, colors(theme)]}>
      {chatroomId && (
        <div className="chatContainer">
          <ChatMessages />
          <MessageInput
            messageInputRef={messageInput}
            handleSubmit={handleSubmit}
          />
        </div>
      )}
      {chatroomId && showMembersList && <MemberList />}
    </div>
  );
}

export default Chat;
