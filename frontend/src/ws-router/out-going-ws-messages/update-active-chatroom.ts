import { getWs } from "../ws";

export const updateActiveChatroom = (chatroomId: string) => {
  const ws = getWs();

  if (!ws) return;

  ws.send(
    JSON.stringify({
      type: "update-active-chatroom",
      chatroomId,
    }),
  );
};
