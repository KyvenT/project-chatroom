import { WS_URL } from "../env";
import { useAuthStore } from "../hooks/useStores";
import type { WSMessage } from "../types/outgoing-ws-messages";
import { wsMessageRouter } from "./router";

let ws: WebSocket | null = null;

let wsIsAuthenticated = false;

export const getWs = () => ws;

export const setWs = (newWs: WebSocket) => {
  ws = newWs;
};

export const isWsAuthenticated = () => wsIsAuthenticated;

export const setWsAuthenticated = (authenticated: boolean) => {
  wsIsAuthenticated = authenticated;
};

export const closeWs = () => {
  ws?.close();
};

export const startWSConnection = () => {
  if (ws) {
    console.log("WebSocket connection already exists");
    return;
  }

  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log("WebSocket connection established");
    const user = useAuthStore.getState().user;
    ws?.send(JSON.stringify({ type: "auth", token: user.token }));
  };
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log("Message from server: ", message);
    wsMessageRouter(message);
  };
  ws.onerror = (error) => {
    console.error(`WebSocket error: ${error}`);
  };
  ws.onclose = () => {
    ws = null;
    setWsAuthenticated(false);
    console.log("WebSocket connection closed");
  };
};

let messageQueue: WSMessage[] = [];

export const sendWSMessage = (message: WSMessage) => {
  if (!ws) {
    console.error("WebSocket connection not established, cannot send message");
  }

  if (
    ws?.readyState === WebSocket.CLOSED ||
    ws?.readyState === WebSocket.CLOSING
  ) {
    console.error("WebSocket connection closed, cannot send message");
    return;
  }

  if (ws?.readyState === WebSocket.CONNECTING || !isWsAuthenticated()) {
    console.log("ws auth state: ", isWsAuthenticated());
    console.warn("WebSocket connecting, queuing message");
    messageQueue.push(message);
    return;
  }

  ws?.send(JSON.stringify(message));
};

export const sendQueuedMessages = () => {
  if (!ws) {
    console.error(
      "WebSocket connection not established, cannot send queued messages",
    );
    return;
  }

  if (ws.readyState !== WebSocket.OPEN) {
    console.error("WebSocket connection not open, cannot send queued messages");
    return;
  }

  messageQueue.forEach((queuedMessage) => {
    console.log("Sending queued message: ", queuedMessage);
    ws?.send(JSON.stringify(queuedMessage));
  });
  messageQueue = [];
};
