import type {
  ChatMessage,
  NotificationMessage,
  StatusMessage,
  TypingPresenceMessage,
  UpdateChatroomsMessage,
  UpdateMembersMessage,
} from "../types/ws-messages";
import type { NavigateFunction } from "react-router";
import { handleChatMessage } from "./chat-message";
import { handleNewNotification } from "./notification";
import { handleUpdateChatrooms } from "./update-chatrooms";
import { handleUpdateMembers } from "./update-members";
import { handleStatusUpdate } from "./status-update";
import { handleTypingPresence } from "./typing-presence";

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
      handleChatMessage(message as ChatMessage);
      break;
    case "notification":
      handleNewNotification(message as NotificationMessage);
      break;
    case "update-chatrooms":
      handleUpdateChatrooms(
        message as UpdateChatroomsMessage,
        chatroomId,
        navigate,
      );
      break;
    case "update-members":
      handleUpdateMembers(message as UpdateMembersMessage);
      break;
    case "status-update":
      handleStatusUpdate(message as StatusMessage);
      break;
    case "typing-presence":
      handleTypingPresence(message as TypingPresenceMessage);
      break;
    default:
      console.log("Unknown message type: " + message.type);
  }
};
