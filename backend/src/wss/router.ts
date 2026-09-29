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
import { updateWatchedChatrooms } from "./incoming-message-routes/update-watched-chatrooms.js";

// handlers are async; an error in one is logged instead of becoming an
// unhandled rejection, which would take the server down
const run = (handler: unknown) =>
  Promise.resolve(handler).catch((err) =>
    console.error("websocket handler error", err),
  );

export const wsMessageRouter = (message: WSMessage, ws: WebSocket) => {
  switch (message.type) {
    case "auth":
      run(authenticateSocket(message, ws));
      break;
    case "message":
      run(handleChatMessage(message, ws));
      break;
    case "update-active-chatroom":
      run(updateActiveChatroom(message, ws));
      break;
    case "typing-presence":
      run(handleTypingPresence(message, ws));
      break;
    case "update-last-viewed-at":
      run(handleUpdateLastViewedAt(message, ws));
      break;
    case "update-watched-chatrooms":
      run(updateWatchedChatrooms(message, ws));
      break;
    default:
      console.log("uncaught message: ", message);
  }
};
