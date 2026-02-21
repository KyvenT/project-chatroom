import { WS_URL } from "../env";

let ws: WebSocket | null = null;

export const getWs = () => ws;

export const setWs = (newWs: WebSocket) => {
  ws = newWs;
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
  };
  ws.onerror = (error) => {
    console.error(`WebSocket error: ${error}`);
  };
  ws.onclose = () => {
    ws = null;
    console.log("WebSocket connection closed");
  };
};
