import WebSocket from "ws";
import { socketMap } from "../../lib/socketMaps.js";
import { UpdateLastViewedAtMessage } from "../../types/ws-messages.js";
import {
  sendUpdateUnreadMessage,
  updateLastViewedAt,
} from "../outgoing-messages/update-unread-count.js";
import { isChatroomMember } from "../membership.js";

export const handleUpdateLastViewedAt = async (
  message: UpdateLastViewedAtMessage,
  ws: WebSocket
) => {
  const { chatroomId } = message;
  const memberId = socketMap.getByValue(ws);

  if (!memberId) {
    console.error("uh oh socket not mapped to a user");
    return;
  }
  // e.g. a chatroom the user just left; nothing to update
  if (!(await isChatroomMember(memberId, chatroomId))) return;

  console.log("update last viewed at: ", chatroomId, memberId);

  try {
    await updateLastViewedAt(chatroomId, memberId);
    sendUpdateUnreadMessage(chatroomId, memberId, 0);
  } catch (err) {
    // a failed update mustn't become an unhandled rejection, which would
    // take the server down
    console.error("failed to update last viewed at", err);
  }
};
