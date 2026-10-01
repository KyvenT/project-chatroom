import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessageList from "../../../components/chat/ChatMessageList";
import MessageInput from "../../../components/chat/MessageInput";
import { useOutletContext, useParams } from "react-router";
import MembersPanel from "../../../components/chat/MembersPanel";
import { isLoggedInSelector, useAuthStore } from "../../../hooks/useStores";
import React, { useCallback, useRef } from "react";
import type { OutletContextType } from "./ChatLayout";
import { TypingIndicator } from "../../../components/chat/TypingIndicator";
import { sendWSMessage } from "../../../ws-router/ws";

const chatStyles = css({
  height: "100%",
  display: "flex",

  ".chatContainer": {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },

  ".typingIndicator": {
    padding: "0 24px",
  },
});

const colors = (theme: Theme) =>
  css({
    color: theme.colors.white,
  });

function Chat() {
  const theme = useTheme();
  const { chatroomId } = useParams();
  const isLoggedIn = useAuthStore(isLoggedInSelector);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const { showMembersList } = useOutletContext<OutletContextType>();

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      if (!isLoggedIn || !messageInput.current || !chatroomId) return;

      sendWSMessage({
        type: "message",
        content: messageInput.current.value,
        chatroomId,
      });

      messageInput.current.value = "";
      messageInput.current.focus();
    },
    [isLoggedIn, chatroomId, messageInput],
  );

  return (
    <div css={[chatStyles, colors(theme)]}>
      {chatroomId && (
        <div className="chatContainer">
          <ChatMessageList key={chatroomId} />
          <TypingIndicator
            chatroomId={chatroomId}
            className="typingIndicator"
          />
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
