import { WebSocketServer } from "ws";
import { socketMap, userActiveChatroomMap } from "../lib/socketMaps.js";
import { IncomingMessage, Server, ServerResponse } from "http";
import { wsMessageRouter } from "./router.js";
import Prisma from "../prisma/prisma.js";

export const startWSS = (
  server: Server<typeof IncomingMessage, typeof ServerResponse>
) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (data: string) => {
      const message = JSON.parse(data);
      console.log(`Received websocket message type: ${message.type}`);
      wsMessageRouter(message, ws);
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      const userId = socketMap.getByValue(ws);

      if (userId) {
        if (userActiveChatroomMap.hasKey(userId)) {
          userActiveChatroomMap.deleteByKey(userId);
        }
        socketMap.deleteByValue(ws);
        console.log("socket logged out: " + userId);
      }
    });
  });
};
