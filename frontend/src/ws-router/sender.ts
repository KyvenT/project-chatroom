import type { WSMessage } from "../types/outgoing-ws-messages";
import { getWs } from "./ws";

let messageQueue: WSMessage[] = [];

export const sendWSMessage = (message: WSMessage) => {
  const ws = getWs();

  if (!ws) {
    console.error("WebSocket connection not established, cannot send message");
    return;
  }

  if (
    ws.readyState === WebSocket.CLOSED ||
    ws.readyState === WebSocket.CLOSING
  ) {
    console.error("WebSocket connection closed, cannot send message");
    return;
  }

  if (
    !ws.readyState ||
    ws.readyState === WebSocket.CONNECTING
    // || !isWsAuthenticated()
  ) {
    console.warn("WebSocket connecting, queuing message");
    messageQueue.push(message);
    ws.onopen = () => {
      console.log("WebSocket connection opened, sending queued messages");
      messageQueue.forEach((queuedMessage) => {
        ws.send(JSON.stringify(queuedMessage));
      });
      messageQueue = [];
    };
    return;
  }
  ws.send(JSON.stringify(message));
};
