export const sendTypingPresence = (ws: WebSocket, chatroomId: string) => {
  ws.send(
    JSON.stringify({
      type: "typing-presence",
      chatroomId,
    }),
  );
};
