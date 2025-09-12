import type { Chatroom } from "../types/REST-types/Chatroom";
import type { Invite } from "../types/REST-types/Invite";
import type { Message } from "../types/REST-types/Message";
import {
  useChatroomsStore,
  useInvitesStore,
  useMembersStore,
  useMessagesStore,
} from "../hooks/useStores";
import type { UpdateUnreadMessage } from "../types/ws-messages";
import type { ChatroomMember } from "../types/REST-types/ChatroomMember";
import type { NavigateFunction } from "react-router";

export const wsMessageRouter = (
  message: any,
  chatroomId: string | undefined,
  navigate: NavigateFunction,
) => {
  switch (message.type) {
    case "auth":
      console.log("Authentication message received");
      break;
    case "chat-message":
      console.log(message);
      useMessagesStore.getState().addNewMessage(message.message as Message);
      break;
    case "notification":
      console.log("notif received");
      console.log(message);
      switch (message.notification.type) {
        case "INVITE":
          useInvitesStore
            .getState()
            .addNewInvite(message.notification.payload.invite as Invite);
          break;
        case "MENTION":
          break;
        case "NEW_MESSAGE":
          break;
        default:
          console.log("Unknown notif type: " + message.notification.type);
      }
      break;
    case "unread-update":
      console.log("unread update");
      const { unreadMessages, chatroomId: affectedChatroom } =
        message as UpdateUnreadMessage;
      useChatroomsStore
        .getState()
        .updateChatroomUnread(unreadMessages, affectedChatroom);
      break;
    case "update-chatrooms":
      switch (message.action) {
        case "join-chatroom":
          console.log("join chatroom received");
          useChatroomsStore
            .getState()
            .addChatroom(message.chatroom as Chatroom);
          navigate("/chat/" + message.chatroom.chatroomId);
          break;
        case "leave-chatroom":
          console.log(
            "leave chatroom received: current " +
              chatroomId +
              ", msg " +
              message.chatroomId,
          );
          console.log("chatroomid ", chatroomId);
          useChatroomsStore.getState().removeChatroom(message.chatroomId);
          if (chatroomId === message.chatroomId) {
            navigate("/chat");
          }
          break;
      }
      break;
    case "update-members":
      console.log("new member joined");
      break;
    case "status-update":
      console.log("received status update");
      useMembersStore.getState().updateMember(message.member as ChatroomMember);
      break;
    default:
      console.log("Unknown message type: " + message.type);
  }
};
