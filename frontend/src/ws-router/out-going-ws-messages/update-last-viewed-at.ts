export const updateLastViewedAt = (ws: WebSocket, chatroomId: string) => {
  ws.send(
    JSON.stringify({
      type: "update-last-viewed-at",
      chatroomId,
    }),
  );
};
