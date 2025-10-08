export const sendChatMessage = (
  ws: WebSocket,
  content: string,
  chatroomId: string,
) => {
  ws.send(
    JSON.stringify({
      type: "message",
      content,
      chatroomId,
    }),
  );
};
