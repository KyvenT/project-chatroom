import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessage from "./ChatMessage";
import useAuthContext from "../../hooks/useAuthContext";
import type { Message } from "../../types/REST-types/Message";
import { queryFunction } from "../../hooks/useCustomQuery";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useMessagesStore } from "../../hooks/useStores";

const styles = css({
  height: "100%",
  display: "flex",
  flexDirection: "column-reverse",
  overflowY: "auto",
  scrollBehavior: "smooth",
  gap: "10px",
  border: 0,
});

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.black,
    color: theme.colors.white,
    scrollbarColor: `${theme.colors.dark_grey} ${theme.colors.black}`,
  });

const ChatMessages = () => {
  const theme = useTheme();
  const { user, isLoggedIn } = useAuthContext();
  const { chatroomId } = useParams();
  const messages = useMessagesStore((state) => state.messages);
  const setMessages = useMessagesStore((state) => state.setMessages);
  const addPrevMessages = useMessagesStore(
    (state) => state.addPreviousMessages,
  );
  const clearMessages = useMessagesStore((state) => state.clearMessages);
  const chatRef = useRef<HTMLDivElement>(null);
  const [getBefore, setBefore] = useState<Date | null>(null);

  const { data } = useQuery<Message[]>({
    queryKey: [chatroomId, isLoggedIn, getBefore?.toISOString()],
    queryFn: () =>
      queryFunction({
        fetchUrl: `http://localhost:3000/api/messages/${chatroomId}/${getBefore?.toISOString()}`,
        user,
      }),
    enabled: !!getBefore,
    staleTime: Infinity,
  });

  useEffect(() => {
    setBefore(new Date());
    clearMessages();
    if (!chatRef.current) return;
    chatRef.current.scrollTop = 0;
  }, [chatroomId]);

  useEffect(() => {
    if (!data || !getBefore) return;
    if (data.length === 0) return;
    const { createdAt } = data[0];
    if (new Date(createdAt) > getBefore) {
      setMessages(data);
    } else {
      addPrevMessages(data);
    }
  }, [data, setMessages, addPrevMessages, getBefore]);

  const getHistoricalMessages = () => {
    const el = chatRef.current;
    if (!el || !data) return;
    if (el.scrollHeight + el.scrollTop - el.clientHeight <= 1) {
      console.log("end reached");
      if (data.length === 0) return;

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
              sender={message.senderUser?.username || "Unnamed User"}
              timestamp={new Date(message.createdAt)}
            />
          );
        })}
    </div>
  );
};

export default ChatMessages;
