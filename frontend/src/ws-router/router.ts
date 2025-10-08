import type {
  ChatMessage,
  NotificationMessage,
  StatusMessage,
  TypingPresenceMessage,
  UpdateChatroomsMessage,
  UpdateMembersMessage,
} from "../types/ws-messages";
import type { NavigateFunction } from "react-router";
import { handleChatMessage } from "./ws-routes/chat-message";
import { handleNewNotification } from "./ws-routes/notification";
import { handleUpdateChatrooms } from "./ws-routes/update-chatrooms";
import { handleUpdateMembers } from "./ws-routes/update-members";
import { handleStatusUpdate } from "./ws-routes/status-update";
import { handleTypingPresence } from "./ws-routes/typing-presence";
import { updateLastViewedAt } from "./out-going-ws-messages/update-last-viewed-at";

export const wsMessageRouter = (
  ws: WebSocket,
  message: any,
  chatroomId: string | undefined,
  navigate: NavigateFunction,
) => {
  switch (message.type) {
    case "auth":
      console.log("Authentication message received");
      break;
    case "chat-message":
      handleChatMessage(message as ChatMessage, chatroomId);
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
      handleUpdateMembers(message as UpdateMembersMessage, chatroomId);
      break;
    case "status-update":
      handleStatusUpdate(message as StatusMessage, chatroomId);
      break;
    case "typing-presence":
      handleTypingPresence(message as TypingPresenceMessage, chatroomId);
      break;
    case "update-last-viewed-at":
      if (!chatroomId) return;
      updateLastViewedAt(ws, chatroomId);
      break;
    default:
      console.log("Unknown message type: " + message.type);
  }
};
