import { css, useTheme, type Theme } from "@emotion/react";
import ChatMessage from "./ChatMessage";
import useAuthContext from "../hooks/useAuthContext";
import type { Message } from "../types/Message";
import { queryFunction } from "../hooks/useCustomQuery";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useMessagesStore } from "../hooks/useStores";

const styles = css({
  minHeight: "100%",
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
  const chatRef = useRef<HTMLDivElement>(null);
  const [getBefore, setBefore] = useState<Date | null>(null);

  if (!chatroomId) {
    console.error("Chatroom ID is not defined");
    throw new Error("tried to render chat messages of undefined chatroom id");
  }
  const { data } = useQuery<Message[]>({
    queryKey: [isLoggedIn, getBefore?.toISOString()],
    queryFn: () =>
      queryFunction({
        fetchUrl: `http://localhost:3000/api/messages/${chatroomId}/${getBefore?.toISOString()}`,
        user,
      }),
    enabled: !!getBefore,
    staleTime: Infinity
  });

  useEffect(() => {
    setBefore(new Date);
  }, [chatroomId])

  useEffect(() => {
    if (data) {
      setMessages(data);
      if (!chatRef.current) return;
      chatRef.current.scrollTop = 0;
    }
  }, [data, setMessages]);

  return (
    <div ref={chatRef} css={[styles, colors(theme)]}>
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
