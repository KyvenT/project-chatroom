import { WebSocketServer } from "ws";
import { socketMap, userActiveChatroomMap } from "../lib/socketMaps.js";
import { IncomingMessage, Server, ServerResponse } from "http";
import { wsMessageRouter } from "./router.js";
import { WSMessageSchema } from "../validators/ws/wsValidation.js";
import { validate } from "../validators/validate.js";

export const startWSS = (
  server: Server<typeof IncomingMessage, typeof ServerResponse>,
) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (data: string) => {
      const message = JSON.parse(data);
      const result = validate(WSMessageSchema, message);

      if (!result.ok) {
        console.log(message);
        console.error("ws message validation error", result.error);
        return;
      }

      console.log(`Received websocket message type: ${message.type}`);
      wsMessageRouter(result.data, ws);
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
        socketMap.deleteByValue(ws);
        console.log("socket logged out: " + userId);
      }
    });
  });
};
