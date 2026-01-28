import WebSocket from "ws";
import { authenticateSocket } from "./incoming-message-routes/auth.js";
import { handleChatMessage } from "./incoming-message-routes/chat-message.js";
import { updateActiveChatroom } from "./incoming-message-routes/active-chatroom.js";
import {
  AuthMessage,
  ChatMessage,
  TypingPresenceMessage,
  UpdateActiveChatroomMessage,
  UpdateLastViewedAtMessage,
  WSMessage,
} from "../types/ws-messages.js";
import { handleTypingPresence } from "./incoming-message-routes/typing-presence.js";
import { handleUpdateLastViewedAt } from "./incoming-message-routes/update-last-viewed-at.js";

export const wsMessageRouter = (message: WSMessage, ws: WebSocket) => {
  switch (message.type) {
    case "auth":
      authenticateSocket(message, ws);
      break;
    case "message":
      handleChatMessage(message, ws);
      break;
    case "update-active-chatroom":
      updateActiveChatroom(message, ws);
      break;
    case "typing-presence":
      handleTypingPresence(message, ws);
      break;
    case "update-last-viewed-at":
      handleUpdateLastViewedAt(message, ws);
      break;
    default:
      console.log("uncaught message: ", message);
  }
};
