import type { WSMessage } from "../types/ws-messages";
import { handleChatMessage } from "./ws-routes/chat-message";
import { handleNewNotification } from "./ws-routes/notification";
import { handleUpdateChatrooms } from "./ws-routes/update-chatrooms";
import { handleUpdateMembers } from "./ws-routes/update-members";
import { handleStatusUpdate } from "./ws-routes/status-update";
import { handleTypingPresence } from "./ws-routes/typing-presence";
import { handleUpdateInvites } from "./ws-routes/update-invites";
import { sendQueuedMessages, setWsAuthenticated } from "./ws";

export const wsMessageRouter = (message: WSMessage) => {
  switch (message.type) {
    case "auth":
      console.log(
        `WS auth ${message.success ? "succeeded" : "failed"}: ${message.error || ""}`,
      );
      console.log("setting ws auth state to: ", message.success);
      setWsAuthenticated(message.success);
      if (message.success) sendQueuedMessages();
      break;
    case "chat-message":
      handleChatMessage(message);
      break;
    case "notification":
      handleNewNotification(message);
      break;
    case "update-chatrooms":
      handleUpdateChatrooms(message);
      break;
    case "update-members":
      handleUpdateMembers(message);
      break;
    case "status-update":
      handleStatusUpdate(message);
      break;
    case "typing-presence":
      handleTypingPresence(message);
      break;
    case "update-invites":
      handleUpdateInvites(message);
      break;
    default:
      console.log("Unknown message type: " + message.type);
  }
};
