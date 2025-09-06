import type { Chatroom, JoinChatroom } from "../types/REST-types/Chatroom";
import type { Invite } from "../types/REST-types/Invite";
import type { Message } from "../types/REST-types/Message";
import {
  useChatroomsStore,
  useInvitesStore,
  useMessagesStore,
} from "../hooks/useStores";

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
      if (message.notification.type === "INVITE") {
        useInvitesStore
          .getState()
          .addNewInvite(message.notification.payload.invite as Invite);
      }
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
