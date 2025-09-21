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
      switch (message.notification.type) {
        case "INVITE":
          useInvitesStore
            .getState()
            .addNewInvite(message.notification.payload.invite as Invite);
          break;
        case "MENTION":
          break;
        case "NEW_MESSAGE":
          const { unreadMessages, chatroomId: affectedChatroom } = message
            .notification.payload as UpdateUnreadMessage;
          useChatroomsStore
            .getState()
            .updateChatroomUnread(unreadMessages, affectedChatroom);
          break;
        default:
          console.log("Unknown notif type: " + message.notification.type);
      }
      break;
    case "update-chatrooms":
      switch (message.action) {
        case "JOIN":
          useChatroomsStore
            .getState()
            .addChatroom(message.chatroom as Chatroom);
          navigate("/chat/" + message.chatroom.chatroomId);
          break;
        case "LEAVE":
          useChatroomsStore.getState().removeChatroom(message.chatroomId);
          if (chatroomId === message.chatroomId) {
            navigate("/chat");
          }
          break;
        case "UPDATE":
          useChatroomsStore
            .getState()
            .updateChatroom(message.chatroom as Chatroom);
          break;
        default:
          console.log("unknown action type for updating chatrooms");
      }
      break;
    case "update-members":
      switch (message.action) {
        case "JOIN":
          useMembersStore.getState().addNewMember(message.member);
          break;
        case "LEAVE":
          useMembersStore.getState().removeMember(message.memberId);
          break;
        default:
          console.log("unknown action type for updating members");
      }
      break;
    case "status-update":
      useMembersStore.getState().updateMember(message.member as ChatroomMember);
      break;
    default:
      console.log("Unknown message type: " + message.type);
  }
};
