import type {
  PinnedChatroom,
  PinnedGroup,
} from "../../types/REST-types/Chatroom";
import { useFetchMessageHistory } from "../../hooks/useFetchMessages";
import { useCallback, useEffect, useRef } from "react";
import { Loader } from "../Loader";
import { css, useTheme } from "@emotion/react";
import { mq } from "../../styles/breakpoints";
import type { Theme } from "@emotion/react";
import ChatMessage from "../chat/ChatMessage";
import { useNavigate } from "react-router";

interface pinnedChatroomsListProps {
  pinnedGroup: PinnedGroup;
}

const styles = css(
  mq({
    maxWidth: "90%",
    display: "flex",
    overflowX: "scroll",
    gap: "4px",
    padding: "8px",

    ".pinned-chatroom": {
      borderRadius: "8px",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      flex: "0 0 22vw",
      aspectRatio: 1.2,
    },

    ".messages": {
      flex: 1,
      width: "22vw",
      display: "flex",
      flexDirection: "column-reverse",
      overflowY: "auto",
    },

    ".history-status": {
      display: "flex",
      justifyContent: "center",
      padding: "8px",
      fontSize: "0.75rem",
    },

    ".chatroom-title-area": {
      padding: "4px 8px",
      borderRadius: "8px 8px 0 0",
      position: "sticky",
      top: 0,
      width: "100%",

      ".chatroom-title": {
        fontWeight: "500",
        fontSize: "1.15rem",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      },
    },
  }),
);

const colors = (theme: Theme) =>
  css(
    mq({
      scrollbarColor: `transparent transparent`,
      "&:hover": {
        scrollbarColor: `${theme.colors.white} transparent`,
      },

      ".pinned-chatroom": {
        color: theme.colors.white,
        backgroundColor: theme.colors.grey,
        scrollbarColor: `transparent transparent`,
        border: `1px solid ${theme.colors.grey}`,
      },

      ".pinned-chatroom:hover": {
        border: `1px solid ${theme.colors.borderStrong}`,
        scrollbarColor: `${theme.colors.white} transparent`,
      },

      ".chatroom-title-area": {
        backgroundColor: theme.colors.dark_grey,
      },

      ".history-status": {
        color: theme.colors.light_grey,
      },
    }),
  );

// how close to the top (px) the preview is scrolled before older messages load
const LOAD_THRESHOLD = 24;

const PinnedChatroomCard = ({ chatroom }: { chatroom: PinnedChatroom }) => {
  const navigate = useNavigate();
  const messagesRef = useRef<HTMLUListElement>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFetchMessageHistory(chatroom.chatroomId, 5, 15);

  const messages = data?.pages.flat() ?? [];

  const loadOlderIfAtTop = useCallback(() => {
    const list = messagesRef.current;
    if (!list || !hasNextPage || isFetchingNextPage) return;

    // the list is column-reverse, so scrollTop is 0 at the bottom and grows
    // negative towards the oldest message
    const distanceFromTop =
      list.scrollHeight - list.clientHeight + list.scrollTop;
    if (distanceFromTop <= LOAD_THRESHOLD) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // if the loaded messages don't fill the preview there's nothing to scroll,
  // so keep loading until it overflows or history runs out
  useEffect(() => {
    loadOlderIfAtTop();
  }, [data, loadOlderIfAtTop]);

  return (
    <li
      className="pinned-chatroom"
      onClick={() => navigate(`${chatroom.chatroomId}`)}
    >
      <div className="chatroom-title-area">
        <h4 className="chatroom-title">{chatroom.chatroom.title}</h4>
      </div>
      <ul className="messages" ref={messagesRef} onScroll={loadOlderIfAtTop}>
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            id={message.id}
            content={message.content}
            sender={message.senderUser || "Unnamed User"}
            timestamp={new Date(message.createdAt)}
          />
        ))}
        {/* last in a column-reverse list, so shown above the oldest message */}
        {isFetchingNextPage && (
          <li className="history-status" aria-label="Loading older messages">
            <Loader />
          </li>
        )}
        {data && !hasNextPage && (
          <li className="history-status">
            {messages.length === 0 ? "No messages yet" : "Start of chat"}
          </li>
        )}
      </ul>
    </li>
  );
};

export const PinnedChatroomsList = ({
  pinnedGroup,
}: pinnedChatroomsListProps) => {
  const theme = useTheme();

  return (
    <ul css={[styles, colors(theme)]}>
      {pinnedGroup.chatrooms.map((chatroom) => (
        <PinnedChatroomCard key={chatroom.chatroomId} chatroom={chatroom} />
      ))}
    </ul>
  );
};
