import { socketMap } from "../../lib/socketMaps.js";
import WebSocket from "ws";
import { AuthMessage } from "../../types/ws-messages.js";
import { verifyAccessToken } from "../../lib/accessToken.js";

export const authenticateSocket = (message: AuthMessage, ws: WebSocket) => {
  const result = verifyAccessToken(message.token);

  if (!result.ok) {
    ws.send(
      JSON.stringify({ type: "auth", success: false, error: result.error }),
    );
    return;
  }

  console.log("websocket jwt verified: " + result.userId);
  socketMap.set(result.userId, ws);
  ws.send(JSON.stringify({ type: "auth", success: true }));
};
