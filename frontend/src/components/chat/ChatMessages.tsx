import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessage from "./ChatMessage";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useMessagesStore } from "../../hooks/useStores";
import { useFetchMessages } from "../../hooks/useFetchMessages";
import { updateLastViewedAt } from "../../ws-router/out-going-ws-messages/update-last-viewed-at";
import useWebSocketContext from "../../hooks/useWebSocketContext";

const styles = css({
  width: "100%",
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column-reverse",
  overflowY: "scroll",
  scrollBehavior: "smooth",
  gap: "10px",
  border: 0,
});

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,
    color: theme.colors.white,
    scrollbarColor: `${theme.colors.dark_grey} transparent`,
  });

const ChatMessages = () => {
  const theme = useTheme();
  const { chatroomId } = useParams();
  const messages = useMessagesStore((state) => state.messages);
  const addPrevMessages = useMessagesStore(
    (state) => state.addPreviousMessages
  );
  const clearMessages = useMessagesStore((state) => state.clearMessages);
  const chatRef = useRef<HTMLDivElement>(null);
  const [getBefore, setBefore] = useState<Date>(new Date());
  const { data } = useFetchMessages(chatroomId, getBefore, 25);
  const { ws } = useWebSocketContext();

  useEffect(() => {
    clearMessages();
  }, [chatroomId]);

  useEffect(() => {
    if (!data) return;
    addPrevMessages(data);
  }, [data, addPrevMessages]);

  useEffect(() => {
    if (!chatroomId || !ws) return;
    updateLastViewedAt(ws, chatroomId);
  }, [messages]);

  const getHistoricalMessages = () => {
    const el = chatRef.current;
    if (!el || !data) return;
    if (el.scrollHeight + el.scrollTop - el.clientHeight <= 1) {
      console.log("end reached");

      // if fetching more messages returns empty array, return
      if (data.length === 0) return;

      // set getBefore to oldest fetched message's date
      const { createdAt } = data[data.length - 1];
      setBefore(new Date(createdAt));
    }
  };

  return (
    <div
      ref={chatRef}
      css={[styles, colors(theme)]}
      onScroll={getHistoricalMessages}
    >
      {messages &&
        messages.map((message) => {
          return (
            <ChatMessage
              key={message.id}
              id={message.id}
              content={message.content}
              sender={message.senderUser || "Unnamed User"}
              timestamp={new Date(message.createdAt)}
            />
          );
        })}
    </div>
  );
};

export default ChatMessages;
