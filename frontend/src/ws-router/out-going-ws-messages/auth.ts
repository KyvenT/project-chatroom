export const handleWSAuth = (
  ws: WebSocket | null,
  setWs: (ws: WebSocket) => void,
  token: string,
) => {
  if (ws) {
    ws.close();
  }
  const newWs = new WebSocket(`wss://${window.location.host}`);

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
