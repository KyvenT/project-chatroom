import { useChatroomsStore, useInvitesStore } from "../../hooks/useStores";
import type { Invite } from "../../types/REST-types/Invite";
import type {
  NotificationMessage,
  UpdateUnreadMessage,
} from "../../types/ws-messages";

export const handleNewNotification = (message: NotificationMessage) => {
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
};
