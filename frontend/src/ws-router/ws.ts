import { WS_URL } from "../env";
import { useAuthStore } from "../hooks/useStores";
import { wsMessageRouter } from "./router";
import { sendWSMessage } from "./sender";

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
  if (ws) {
    ws.close();
  }
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
    sendWSMessage({ type: "auth", token: user.token });
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
