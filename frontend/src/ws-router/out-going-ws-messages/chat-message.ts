import { getWs } from "../ws";

export const sendChatMessage = (content: string, chatroomId: string) => {
  const ws = getWs();
  if (!ws) return;
  ws.send(
    JSON.stringify({
      type: "message",
      content,
      chatroomId,
    }),
  );
};
