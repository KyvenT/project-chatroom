export const handleWSAuth = (
  ws: WebSocket | null,
  setWs: (ws: WebSocket) => void,
  token: string,
) => {
  if (ws) {
    ws.close();
  }
  const newWs = new WebSocket("ws://localhost:3000");

  newWs.onopen = () => {
    newWs.send(
      JSON.stringify({
        type: "auth",
        token,
      }),
    );
    setWs(newWs);
  };
};
