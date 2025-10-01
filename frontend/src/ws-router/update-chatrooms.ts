import type { NavigateFunction } from "react-router";
import { useChatroomsStore } from "../hooks/useStores";
import type { UpdateChatroomsMessage } from "../types/ws-messages";
import type { Chatroom } from "../types/REST-types/Chatroom";

export const handleUpdateChatrooms = (
  message: UpdateChatroomsMessage,
  chatroomId: string | undefined,
  navigate: NavigateFunction,
) => {
  switch (message.action) {
    case "JOIN":
      if (!message.chatroom) return;
      useChatroomsStore.getState().addChatroom(message.chatroom as Chatroom);
      navigate("/chat/" + message.chatroom.chatroomId);
      break;
    case "LEAVE":
      if (!message.chatroomId) return;
      useChatroomsStore.getState().removeChatroom(message.chatroomId);
      if (chatroomId === message.chatroomId) {
        navigate("/chat");
      }
      break;
    case "UPDATE":
      useChatroomsStore.getState().updateChatroom(message.chatroom as Chatroom);
      break;
    default:
      console.log("unknown action type for updating chatrooms");
  }
};
