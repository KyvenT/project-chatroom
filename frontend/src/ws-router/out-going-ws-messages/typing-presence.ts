import { getWs } from "../ws";

export const sendTypingPresence = (chatroomId: string) => {
  const ws = getWs();
  if (!ws) return;
  ws.send(
    JSON.stringify({
      type: "typing-presence",
      chatroomId,
    }),
  );
};
