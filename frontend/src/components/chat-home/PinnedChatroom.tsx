import { useNavigate } from "react-router";
import ChatMessage from "../chat/ChatMessage";
import type { PinnedChatroom as PinnedChatroomType } from "../../types/REST-types/Chatroom";
import type { Message } from "../../types/REST-types/Message";

export interface PinnedChatroomProps {
  chatroom: PinnedChatroomType;
  messages: Message[];
}

export const PinnedChatroom = ({ chatroom, messages }: PinnedChatroomProps) => {
  const navigate = useNavigate();

  const handleClick = (chatroomId: string) => {
    navigate(`/chat/${chatroomId}`);
  };

  return (
    <div>
      <li
        className="pinned-chatroom"
        key={chatroom.chatroomId}
        onClick={() => handleClick(chatroom.chatroomId)}
      >
        <div className="chatroom-title-area">
          <h4 className="chatroom-title">{chatroom.chatroom.title}</h4>
        </div>
        <ul className="messages">
          {messages.map((message) => (
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
    </div>
  );
};
