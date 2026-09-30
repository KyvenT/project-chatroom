import { WebSocketServer } from "ws";
import {
  socketMap,
  userActiveChatroomMap,
  userWatchedChatroomsMap,
} from "../lib/socketMaps.js";
import { IncomingMessage, Server, ServerResponse } from "http";
import { wsMessageRouter } from "./router.js";
import { WSMessageSchema } from "../validators/ws/wsValidation.js";
import { socketSessions } from "../lib/socketSessions.js";
import { validate } from "../validators/validate.js";
import {
  rateLimit,
  RateLimitWindowCount,
} from "../middleware/rateLimitMiddleware.js";
import { WSMessageTypes } from "../types/ws-messages.js";

const messageCount = new Map<string, RateLimitWindowCount>();

const WS_MESSAGE_LIMIT = 20;
const WS_MESSAGE_INTERVAL = 1000; // 1000 = 1sec
const AUTH_TIMEOUT = 10 * 1000;

export const startWSS = (
  server: Server<typeof IncomingMessage, typeof ServerResponse>,
) => {
  // chat messages are short, so anything much bigger isn't from the app
  const wss = new WebSocketServer({ server, maxPayload: 16 * 1024 });

  wss.on("connection", (ws) => {
    console.log("New client connected");

    // connections have to sign in soon after opening
    const authTimeout = setTimeout(() => {
      if (!socketMap.hasValue(ws)) ws.close(4001, "Authentication timeout");
    }, AUTH_TIMEOUT);
    ws.on("close", () => {
      clearTimeout(authTimeout);
      socketSessions.remove(ws);
    });

    // e.g. an oversized or malformed frame; the socket is closed for it, but
    // an unhandled error event would take the whole server down
    ws.on("error", (err) => {
      console.error("websocket error", err.message);
    });

    ws.on("message", (data: string) => {
      let message;
      try {
        message = JSON.parse(data);
      } catch (err) {
        console.error("invalid json format");
        return;
      }

      const validated = validate(WSMessageSchema, message);
      const userId = socketMap.getByValue(ws);

      if (!validated.ok) {
        console.log(message);
        console.error("ws message validation error", validated.error);
        return;
      }

      if (userId) {
        const rateLimited = rateLimit(
          userId,
          messageCount,
          WS_MESSAGE_LIMIT,
          WS_MESSAGE_INTERVAL,
        );

        if (!rateLimited.ok) {
          console.error("ws message rate limit reached for ", userId);
          return;
        }
      }

      if (!userId && validated.data.type !== WSMessageTypes.Auth) {
        console.error("unauthorized ws message");
        ws.send("Unauthorized: Must authenticate before sending messages");
        return;
      }

      console.log(`Received websocket message type: ${message.type}`);
      wsMessageRouter(validated.data, ws);
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      const userId = socketMap.getByValue(ws);

      if (userId) {
        const chatroom = userActiveChatroomMap.getByKey(userId);
        if (chatroom) {
          // updateLastViewedAt(chatroom, userId);
          userActiveChatroomMap.deleteByKey(userId);
        }
        userWatchedChatroomsMap.deleteUser(userId);
        socketMap.deleteByValue(ws);
        console.log("socket logged out: " + userId);
      }
    });
  });
};
