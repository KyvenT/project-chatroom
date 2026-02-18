import { API_URL } from "../env";

let ws: WebSocket | null = null;

export const getWs = () => ws;

export const setWs = (newWs: WebSocket) => {
  ws = newWs;
};

export const closeWs = () => {
  if (ws) {
    ws.close();
    ws = null;
  }
};

export const startWSConnection = () => {
  const newWs = new WebSocket(`wss://${API_URL}`);

  newWs.onopen = () => {
    console.log("WebSocket connection established");
  };
  newWs.onerror = (error) => {
    console.error(`WebSocket error: ${error}`);
  };
  newWs.onclose = () => {
    ws = null;
    console.log("WebSocket connection closed");
  };
};
