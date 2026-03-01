import jwt from "jsonwebtoken";
import { socketMap } from "../../lib/socketMaps.js";
import env from "../../env.js";
import WebSocket from "ws";
import { AuthMessage } from "../../types/ws-messages.js";

export const authenticateSocket = (message: AuthMessage, ws: WebSocket) => {
  console.log("currently authenticated websockets: ");
  socketMap.forEach((value, key) => {
    console.log(key + ": " + value);
  });
  console.log("authenticating websocket");
  jwt.verify(message.token, env.JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        ws.send(
          JSON.stringify({
            type: "auth",
            success: false,
            error: "Expired token",
          }),
        );
        return;
      }
      ws.send(JSON.stringify({ type: "auth", success: false, error: err }));
      return;
    }

    if (!decoded.userId) {
      ws.send(
        JSON.stringify({
          type: "auth",
          success: false,
          error: "Error decrypting token",
        }),
      );
      return;
    }

    const { userId } = decoded;

    console.log("websocket jwt verified: " + userId);
    socketMap.set(userId, ws);
    ws.send(JSON.stringify({ type: "auth", success: true }));
  });
};
