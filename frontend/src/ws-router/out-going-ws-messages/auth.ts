import { getWs } from "../ws";

export const handleWSAuth = (token: string) => {
  const ws = getWs();

  if (!ws) {
    console.error("WebSocket connection not established");
    return;
  }
  ws.send(
    JSON.stringify({
      type: "auth",
      token,
    }),
  );
};
