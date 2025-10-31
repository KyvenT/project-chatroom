import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessages from "../../../components/chat/ChatMessages";
import MessageInput from "../../../components/chat/MessageInput";
import { useOutletContext, useParams } from "react-router";
import MembersPanel from "../../../components/chat/MembersPanel";
import useAuthContext from "../../../hooks/useAuthContext";
import useWebSocketContext from "../../../hooks/useWebSocketContext";
import { useEffect, useRef } from "react";
import type { OutletContextType } from "./ChatLayout";
import { useTypingPresenceStore } from "../../../hooks/useStores";
import { sendChatMessage } from "../../../ws-router/out-going-ws-messages/chat-message";

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
  const typingUsers = useTypingPresenceStore((state) => state.typingUsers);
  const popTypingUser = useTypingPresenceStore((state) => state.popTypingUser);

  useEffect(() => {
    if (typingUsers.length === 0) return;
    const typingPresenceDuration = setTimeout(() => {
      popTypingUser();
    }, 3000);
    return () => {
      clearTimeout(typingPresenceDuration);
    };
  }, [typingUsers]);

  const handleSubmit = () => {
    if (!isLoggedIn || !messageInput.current || !chatroomId || !ws) return;

    sendChatMessage(ws, messageInput.current.value, chatroomId);

    messageInput.current.value = "";
    messageInput.current.focus();
  };

  return (
    <div css={[chatStyles, colors(theme)]}>
      {chatroomId && (
        <div className="chatContainer">
          <ChatMessages key={chatroomId} />
          {typingUsers.length > 0 && (
            <>
              {typingUsers.map((typingUser) => (
                <span key={typingUser.userId}>{typingUser.username}</span>
              ))}
              <p> is typing...</p>
            </>
          )}
          <MessageInput
            messageInputRef={messageInput}
            handleSubmit={handleSubmit}
          />
        </div>
      )}
      {chatroomId && showMembersList && <MembersPanel />}
    </div>
  );
}

export default Chat;
