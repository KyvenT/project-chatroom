import {
  useActiveChatroomStore,
  useChatroomsStore,
} from "../../hooks/useStores";
import type { UpdateChatroomsMessage } from "../../types/ws-messages";
import type { Chatroom } from "../../types/REST-types/Chatroom";
import { redirect } from "react-router";

export const handleUpdateChatrooms = (message: UpdateChatroomsMessage) => {
  const chatroomId = useActiveChatroomStore.getState().activeChatroomId;

  switch (message.action) {
    case "JOIN":
      if (!message.chatroom) return;
      useChatroomsStore.getState().addChatroom(message.chatroom as Chatroom);
      redirect("/chat/" + message.chatroom.chatroomId);
      break;
    case "LEAVE":
      if (!message.chatroomId) return;
      useChatroomsStore.getState().removeChatroom(message.chatroomId);
      if (chatroomId === message.chatroomId) {
        redirect("/chat");
      }
      break;
    case "UPDATE":
      useChatroomsStore.getState().updateChatroom(message.chatroom as Chatroom);
      break;
    default:
      console.log("unknown action type for updating chatrooms");
  }
};
