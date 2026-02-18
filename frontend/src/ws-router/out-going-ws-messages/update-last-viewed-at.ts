import { getWs } from "../ws";

export const updateLastViewedAt = (chatroomId: string) => {
  const ws = getWs();

  if (!ws) return;

  ws.send(
    JSON.stringify({
      type: "update-last-viewed-at",
      chatroomId,
    }),
  );
};
