import WebSocket from "ws";
import { authenticateSocket } from "./incoming-message-routes/auth.js";
import { handleChatMessage } from "./incoming-message-routes/chat-message.js";
import { updateActiveChatroom } from "./incoming-message-routes/active-chatroom.js";
import {
  AuthMessage,
  ChatMessage,
  UpdateActiveChatroomMessage,
} from "../types/ws-messages.js";

export const wsMessageRouter = (message: any, ws: WebSocket) => {
  switch (message.type) {
    case "auth":
      authenticateSocket(message as AuthMessage, ws);
      break;
    case "message":
      handleChatMessage(message as ChatMessage, ws);
      break;
    case "update-active-chatroom":
      updateActiveChatroom(message as UpdateActiveChatroomMessage, ws);
      break;
    case "typing-presence":
      handleTypingPresence(message as TypingPresenceMessage, ws);
      break;
    default:
      console.log("uncaught message: " + message);
  }
};
