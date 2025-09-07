import type { Chatroom } from "../types/REST-types/Chatroom";
import type { Invite } from "../types/REST-types/Invite";
import type { Message } from "../types/REST-types/Message";
import {
  useChatroomsStore,
  useInvitesStore,
  useMessagesStore,
} from "../hooks/useStores";
import type { UpdateUnreadMessage } from "../types/ws-messages";

export const wsMessageRouter = (message: any) => {
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
      const { unreadMessages, chatroomId } = message as UpdateUnreadMessage;
      useChatroomsStore
        .getState()
        .updateChatroomUnread(unreadMessages, chatroomId);
      break;
    case "join-chatroom":
      console.log("join chatroom received");
      useChatroomsStore.getState().addChatroom(message.chatroom as Chatroom);
      break;
    case "new-member":
      console.log("new member joined");
      break;
    default:
      console.log("Unknown message type: " + message.type);
  }
};
