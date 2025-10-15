import WebSocket from "ws";
import { socketMap } from "../../lib/socketMaps.js";
import { UpdateLastViewedAtMessage } from "../../types/ws-messages.js";
import {
  sendUpdateUnreadMessage,
  updateLastViewedAt,
} from "../outgoing-messages/update-unread-count.js";

export const handleUpdateLastViewedAt = (
  message: UpdateLastViewedAtMessage,
  ws: WebSocket
) => {
  const { chatroomId } = message;
  const memberId = socketMap.getByValue(ws);

  if (!memberId) {
    console.error("uh oh socket not mapped to a user");
    return;
  }
  console.log("update last viewed at: ", chatroomId, memberId);

  updateLastViewedAt(chatroomId, memberId);
  sendUpdateUnreadMessage(chatroomId, memberId, 0);
};
