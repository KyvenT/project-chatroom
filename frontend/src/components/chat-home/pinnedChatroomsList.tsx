import type { PinnedGroup } from "../../types/REST-types/Chatroom";
import { useFetchMessagesMultiple } from "../../hooks/useFetchMessages";
import ChatMessage from "../chat/ChatMessage";
import { useState } from "react";
import { css, useTheme } from "@emotion/react";
import { mq } from "../../styles/breakpoints";
import type { Theme } from "@emotion/react";
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
  })
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
      },

      ".pinned-chatroom:hover": {
        border: `1px solid ${theme.colors.white}`,
        scrollbarColor: `${theme.colors.white} transparent`,
      },

      ".chatroom-title-area": {
        backgroundColor: theme.colors.dark_grey,
      },
    })
  );

export const PinnedChatroomsList = ({
  pinnedGroup,
}: pinnedChatroomsListProps) => {
  const [getBefore] = useState<Date>(new Date());
  const theme = useTheme();
  const navigate = useNavigate();

  const results = useFetchMessagesMultiple(
    pinnedGroup.pinnedChatrooms.map((chatroom) => chatroom.chatroomId),
    getBefore,
    5
  );

  const handleClick = (chatroomId: string) => {
    navigate(`/chat/${chatroomId}`);
  };

  return (
    <ul css={[styles, colors(theme)]}>
      {pinnedGroup.pinnedChatrooms.map((chatroom, i) => (
        <li
          className="pinned-chatroom"
          key={chatroom.chatroomId}
          onClick={() => handleClick(chatroom.chatroomId)}
        >
          <div className="chatroom-title-area">
            <h4 className="chatroom-title">{chatroom.chatroom.title}</h4>
          </div>
          <ul className="messages">
            {results[i].data?.map((message) => (
              <ChatMessage
                key={message.id}
                id={message.id}
                content={message.content}
                sender={message.senderUser || "Unnamed User"}
                timestamp={new Date(message.createdAt)}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
};
