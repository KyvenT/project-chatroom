export const updateActiveChatroom = (ws: WebSocket, chatroomId: string) => {
  ws.send(
    JSON.stringify({
      type: "update-active-chatroom",
      chatroomId,
    }),
  );
};
