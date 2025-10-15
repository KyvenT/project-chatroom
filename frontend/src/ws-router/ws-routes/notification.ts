import { useChatroomsStore } from "../../hooks/useStores";
import type {
  NotificationMessage,
  UpdateUnreadMessage,
} from "../../types/ws-messages";

export const handleNewNotification = (message: NotificationMessage) => {
  console.log("notif received");
  switch (message.notification.type) {
    case "INVITE":
      console.log(
        "new invite received: ",
        message.notification.payload.inviteId,
      );
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
