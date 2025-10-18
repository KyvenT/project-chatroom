import type { PinnedGroup } from "../../types/REST-types/Chatroom";
import { useFetchMessagesMultiple } from "../../hooks/useFetchMessages";
import ChatMessage from "../chat/ChatMessage";
import { useState } from "react";
import { css, useTheme } from "@emotion/react";
import { mq } from "../../styles/breakpoints";
import type { Theme } from "@emotion/react";

interface pinnedChatroomsListProps {
  pinnedGroup: PinnedGroup;
}

const styles = css(
  mq({
    display: "flex",
    width: "100%",
    height: "100%",

    ".pinned-chatroom": {
      borderRadius: "8px",
      width: "25%",
      cursor: "pointer",
      aspectRatio: 1,
      height: "100%",
      overflowY: "auto",

      div: {
        width: "100%",
      },
    },

    ".messages": {},

    ".chatroom-title-area": {
      padding: "4px 8px",
      position: "sticky",
      top: 0,
      width: "100%",

      ".chatroom-title": {
        fontWeight: "500",
        fontSize: "1.15rem",
      },
    },
  }),
);

const colors = (theme: Theme) =>
  css(
    mq({
      ".pinned-chatroom": {
        color: theme.colors.white,
        border: `1px solid ${theme.colors.dark_grey}`,
        backgroundColor: theme.colors.grey,
        scrollbarColor: `transparent transparent`,
      },

      ".pinned-chatroom:hover": {
        borderColor: theme.colors.white,
        scrollbarColor: `${theme.colors.white} transparent`,
      },

      ".chatroom-title-area": {
        backgroundColor: theme.colors.dark_grey,
      },
    }),
  );

export const PinnedChatroomsList = ({
  pinnedGroup,
}: pinnedChatroomsListProps) => {
  const [getBefore] = useState<Date>(new Date());
  const theme = useTheme();

  const results = useFetchMessagesMultiple(
    pinnedGroup.pinnedChatrooms.map((chatroom) => chatroom.chatroomId),
    getBefore,
    5,
  );

  return (
    <ul css={[styles, colors(theme)]}>
      {pinnedGroup.pinnedChatrooms.map((chatroom, i) => (
        <li className="pinned-chatroom" key={chatroom.chatroomId}>
          <div className="chatroom-title-area">
            <h4 className="chatroom-title">{chatroom.chatroom.title}</h4>
          </div>
          <ul className="messages">
            {results[i].data?.map((message) => (
              <ChatMessage
                key={message.id}
                id={message.id}
                content={message.content}
                sender={message.senderUser.username || "Unnamed User"}
                timestamp={new Date(message.createdAt)}
              />
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
};
